from io import BytesIO
from typing import Optional
import pandas as pd
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Image, Spacer, PageBreak
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader


def dataframe_and_image_to_pdf(
    df: pd.DataFrame,
    image_bytes: BytesIO,
    title: Optional[str] = None,
    columns=None,
    page_size=landscape(A4),
    image_size=(400, 250)
) -> BytesIO:
    """
    将 DataFrame 表格和图像（PNG 字节流）嵌入到一个 PDF 中，返回 BytesIO。
    """
    pdf_buf = BytesIO()

    try:
        doc = SimpleDocTemplate(pdf_buf, pagesize=page_size)
        elements = []

        # 图像处理
        if image_bytes:
            try:
                image_bytes.seek(0)
                img_reader = ImageReader(image_bytes)
                img_w, img_h = img_reader.getSize()

                # 页面尺寸
                page_width, page_height = page_size
                margin_x = 40
                margin_y = 40
                usable_width = page_width - 2 * margin_x
                usable_height = page_height - 2 * margin_y

                scale = min(usable_width / img_w, usable_height / img_h)
                scaled_w = img_w * scale
                scaled_h = img_h * scale

                image = Image(image_bytes, width=scaled_w, height=scaled_h)
                spacer_top = Spacer(1, (page_height - scaled_h) / 2)

                elements.append(spacer_top)
                elements.append(image)
                elements.append(PageBreak())
            except Exception as e:
                raise ValueError(f"[ERROR] 图像处理失败: {e}")

        # DataFrame 处理
        if columns is not None:
            try:
                df = df[columns].copy()
            except Exception as e:
                raise ValueError(f"[ERROR] 提取指定列失败: {e}")

        try:
            split_indices = df[df.isnull().all(axis=1)].index.tolist()

            prev_idx = 0
            parts = []
            for idx in split_indices:
                part = df.iloc[prev_idx:idx]
                if not part.empty:
                    parts.append(part)
                prev_idx = idx + 1
            if prev_idx < len(df):
                parts.append(df.iloc[prev_idx:])
        except Exception as e:
            raise ValueError(f"[ERROR] DataFrame 分段失败: {e}")

        # 构建表格元素
        try:
            for i in range(0, len(parts), 2):
                page_parts = parts[i:i + 2]
                for part in page_parts:
                    table_data = [part.columns.tolist()] + part.fillna("").values.tolist()
                    table = Table(table_data)

                    ncols = len(table_data[0])
                    page_width, _ = page_size
                    max_col_width = 100
                    col_width = min(page_width / ncols, max_col_width)
                    table._argW = [col_width] * ncols

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
                    elements.append(table)
                    elements.append(Spacer(1, 30))

                if i + 2 < len(parts):
                    elements.append(PageBreak())
        except Exception as e:
            raise ValueError(f"[ERROR] 构建表格失败: {e}")

        # 构建 PDF
        try:
            doc.build(elements)
            pdf_buf.seek(0)
            return pdf_buf
        except Exception as e:
            raise ValueError(f"[ERROR] PDF 构建失败: {e}")

    except Exception as e:
        raise ValueError(f"[ERROR] dataframe_and_image_to_pdf 运行失败: {e}")

