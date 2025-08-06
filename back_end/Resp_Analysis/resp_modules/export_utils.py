from io import BytesIO
from typing import Optional, Dict, List, Generator
import zipfile
import pandas as pd
import numpy as np
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Image, Spacer, PageBreak
)
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
import orjson

class ExportUtils:

    # --- 私有静态工具函数 ---

    @staticmethod
    def _serialize_plot_series(col: str, time_axis: np.ndarray, values: np.ndarray) -> bytes:
        arr = np.stack((time_axis, values), axis=1)
        return orjson.dumps({
            "id": col,
            "data": [{"x": x, "y": y} for x, y in arr.tolist()]
        })

    @staticmethod
    def _validate_bytesio_files(files: Dict[str, BytesIO]):
        for name, buf in files.items():
            if not isinstance(buf, BytesIO):
                raise TypeError(f"[ERROR] '{name}' must be a BytesIO object")

    @staticmethod
    def _split_dataframe(df: pd.DataFrame) -> List[pd.DataFrame]:
        split_indices = df[df.isnull().all(axis=1)].index.tolist()
        parts = []
        prev = 0
        for idx in split_indices:
            part = df.iloc[prev:idx]
            if not part.empty:
                parts.append(part)
            prev = idx + 1
        if prev < len(df):
            parts.append(df.iloc[prev:])
        return parts

    @staticmethod
    def _build_table(df: pd.DataFrame, page_width: int) -> Table:
        data = [df.columns.tolist()] + df.fillna("").values.tolist()
        ncols = len(data[0])
        col_width = min(page_width / ncols, 100)
        table = Table(data, colWidths=[col_width] * ncols)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("ALIGN", (0, 1), (-1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 2),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ]))
        return table

    @staticmethod
    def _process_image(image_bytes: BytesIO, page_size) -> Optional[Image]:
        image_bytes.seek(0)
        reader = ImageReader(image_bytes)
        iw, ih = reader.getSize()
        pw, ph = page_size
        max_width = pw * 0.9
        max_height = ph * 0.65
        scale = min(max_width / iw, max_height / ih)
        return Image(image_bytes, width=iw * scale, height=ih * scale)

    # --- 核心导出接口 ---

    @staticmethod
    def dataframe_to_csv_bytes(
        df: pd.DataFrame,
        index: bool = False,
        encoding: str = "utf-8",
        na_rep: Optional[str] = ""
    ) -> BytesIO:
        try:
            csv_bytes = df.to_csv(index=index, na_rep=na_rep).encode(encoding)
            return BytesIO(csv_bytes)
        except Exception as e:
            raise ValueError(f"[ERROR] Failed to encode DataFrame: {e}")

    @staticmethod
    def dataframe_to_excel_bytes(
        df: pd.DataFrame,
        index: bool = False,
        sheet_name: str = "Data",
        freeze_header: bool = True
    ) -> BytesIO:
        """
        Convert DataFrame to Excel bytes with optional frozen header row.
        
        Args:
            df: DataFrame to convert
            index: Whether to include index
            sheet_name: Name of the worksheet
            freeze_header: Whether to freeze the first row (header)
            
        Returns:
            BytesIO: Excel file as bytes buffer
        """
        try:
            import openpyxl
            from openpyxl.utils.dataframe import dataframe_to_rows
            
            # Create workbook and worksheet
            workbook = openpyxl.Workbook()
            worksheet = workbook.active
            worksheet.title = sheet_name
            
            # Convert DataFrame to rows
            rows = dataframe_to_rows(df, index=index, header=True)
            
            # Write data to worksheet
            for r_idx, row in enumerate(rows, 1):
                for c_idx, value in enumerate(row, 1):
                    worksheet.cell(row=r_idx, column=c_idx, value=value)
            
            # Freeze the header row if requested
            if freeze_header and len(df) > 0:
                worksheet.freeze_panes = "A2"
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
            
            # Save to bytes buffer
            excel_buffer = BytesIO()
            workbook.save(excel_buffer)
            excel_buffer.seek(0)
            return excel_buffer
            
        except Exception as e:
            raise ValueError(f"[ERROR] Failed to create Excel file: {e}")

    @staticmethod
    def dataframe_to_plot_json(
        df: pd.DataFrame,
        columns: List[str],
        sample_rate: float = 200.0
    ) -> Generator[bytes, None, None]:
        index = df.index.to_numpy()
        try:
            time_axis = index.astype(np.float32) / sample_rate
        except Exception:
            raise ValueError("Index must be numeric")

        yield b"["
        for i, col in enumerate(columns):
            if col not in df.columns:
                raise ValueError(f"Column '{col}' not found")
            values = df[col].to_numpy(dtype=np.float32)
            if i > 0:
                yield b","  # comma between JSON objects
            yield ExportUtils._serialize_plot_series(col, time_axis, values)
        yield b"]"

    @staticmethod
    def dataframe_and_image_to_pdf(
        df: pd.DataFrame,
        image_bytes: Optional[BytesIO],
        columns: Optional[List[str]] = None,
        page_size=landscape(A4)
    ) -> BytesIO:
        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=page_size)
        elements = []

        if image_bytes:
            try:
                img = ExportUtils._process_image(image_bytes, page_size)
                elements.extend([Spacer(1, 30), img, PageBreak()])
            except Exception as e:
                raise ValueError(f"[ERROR] Image processing failed: {e}")

        if columns:
            try:
                df = df[columns].copy()
            except Exception as e:
                raise ValueError(f"[ERROR] Column filtering failed: {e}")

        try:
            parts = ExportUtils._split_dataframe(df)
            page_width, _ = page_size
            for i, part in enumerate(parts):
                elements.append(ExportUtils._build_table(part, page_width))
                elements.append(Spacer(1, 30))
                if i + 1 < len(parts):
                    elements.append(PageBreak())
        except Exception as e:
            raise ValueError(f"[ERROR] Table generation failed: {e}")

        try:
            doc.build(elements)
            buf.seek(0)
            return buf
        except Exception as e:
            raise ValueError(f"[ERROR] PDF build failed: {e}")

    @staticmethod
    def write_zip(files: Dict[str, BytesIO]) -> BytesIO:
        ExportUtils._validate_bytesio_files(files)
        buf = BytesIO()
        try:
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zipf:
                for name, file in files.items():
                    file.seek(0)
                    zipf.writestr(name, file.read())
            buf.seek(0)
            return buf
        except Exception as e:
            raise RuntimeError(f"[ERROR] Failed to create ZIP: {e}")

