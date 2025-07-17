import openpyxl
from openpyxl.cell import MergedCell
from openpyxl.drawing.image import Image as ExcelImage
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import io
import os
import logging
import tempfile
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class VideoExportEngine:
    """
    Handles exporting video analysis results to various formats
    """
    
    def __init__(self, session_manager=None):
        self.workbook = None
        self.worksheet = None
        self.session_manager = session_manager
        self.temp_files = []  # Track temporary files for cleanup
        
    def create_excel_export(self, frames_data: List[Dict], baseline_frame_id: str = None, 
                           export_metadata: Dict = None) -> io.BytesIO:
        """
        Create Excel file with analysis results
        
        Args:
            frames_data: List of frame data with pre-calculated percentages
            baseline_frame_id: ID of the baseline frame
            export_metadata: Additional export information
            
        Returns:
            io.BytesIO: Excel file as bytes buffer
        """
        try:
            logger.info(f"Starting Excel export for {len(frames_data)} frames")
            
            self.workbook = openpyxl.Workbook()
            self.worksheet = self.workbook.active
            self.worksheet.title = "Analysis Results"
            
            # Apply styling and structure
            self._setup_styles()
            current_row = self._add_header_section(export_metadata)
            current_row = self._add_metadata_section(frames_data, baseline_frame_id, current_row)
            
            # Process each frame
            for i, frame_data in enumerate(frames_data):
                logger.info(f"Processing frame {i+1}/{len(frames_data)}: {frame_data.get('custom_name', 'Unnamed')}")
                current_row = self._add_frame_section(frame_data, current_row)
            
            # Final formatting
            self._apply_final_formatting()
            
            # Save to memory buffer
            excel_buffer = io.BytesIO()
            self.workbook.save(excel_buffer)
            excel_buffer.seek(0)
            
            # Clean up temporary files AFTER saving Excel
            self._cleanup_temp_files()
            
            logger.info("Excel export completed successfully")
            return excel_buffer
            
        except Exception as e:
            logger.error(f"Excel export failed: {e}")
            # Clean up temporary files on error
            self._cleanup_temp_files()
            raise
    
    def _cleanup_temp_files(self):
        """Clean up all temporary files created during export"""
        for temp_file_path in self.temp_files:
            try:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    logger.debug(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temp file {temp_file_path}: {cleanup_error}")
        self.temp_files.clear()
    
    def _setup_styles(self):
        """Define styles used throughout the document"""
        self.styles = {
            'main_header': {
                'font': Font(bold=True, size=18, color="FFFFFF"),
                'fill': PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid"),
                'alignment': Alignment(horizontal='center', vertical='center')
            },
            'section_header': {
                'font': Font(bold=True, size=14, color="FFFFFF"),
                'fill': PatternFill(start_color="366092", end_color="366092", fill_type="solid"),
                'alignment': Alignment(horizontal='center', vertical='center'),
                'border': self._create_border()
            },
            'sub_header': {
                'font': Font(bold=True, size=12),
                'fill': PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid"),
                'alignment': Alignment(horizontal='center', vertical='center'),
                'border': self._create_border()
            },
            'data_cell': {
                'alignment': Alignment(horizontal='center', vertical='center'),
                'border': self._create_border()
            }
        }
    
    def _create_border(self):
        """Create standard border style"""
        return Border(
            top=Side(style='thin'),
            left=Side(style='thin'),
            bottom=Side(style='thin'),
            right=Side(style='thin')
        )
    
    def _add_header_section(self, export_metadata: Dict = None) -> int:
        """Add main header section"""
        # Main title
        self.worksheet.merge_cells('A1:H2')
        cell = self.worksheet['A1']
        cell.value = 'Video Analysis Results'
        self._apply_style(cell, 'main_header')
        
        return 4
    
    def _add_metadata_section(self, frames_data: List[Dict], baseline_frame_id: str, 
                            current_row: int) -> int:
        """Add export metadata section"""
        # Export metadata
        self.worksheet[f'A{current_row}'].value = 'Export Date:'
        self.worksheet[f'B{current_row}'].value = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        current_row += 1
        
        self.worksheet[f'A{current_row}'].value = 'Total Frames:'
        self.worksheet[f'B{current_row}'].value = len(frames_data)
        current_row += 1
        
        # Find baseline frame name
        baseline_frame = next((f for f in frames_data if f.get("frame_id") == baseline_frame_id), None)
        if baseline_frame:
            self.worksheet[f'A{current_row}'].value = 'Baseline Frame:'
            baseline_name = baseline_frame.get("custom_name", f"Frame {baseline_frame.get('frame_idx')}")
            self.worksheet[f'B{current_row}'].value = baseline_name
        
        return current_row + 2
    
    def _add_frame_section(self, frame_data: Dict, current_row: int) -> int:
        """Add individual frame section with data table"""
        # Frame header
        self.worksheet.merge_cells(f'A{current_row}:H{current_row}')
        frame_name = frame_data.get('custom_name', f"Frame {frame_data.get('frame_idx')}")
        baseline_text = ' (Baseline)' if frame_data.get('is_baseline', False) else ''
        header_cell = self.worksheet[f'A{current_row}']
        header_cell.value = f"{frame_name}{baseline_text}"
        self._apply_style(header_cell, 'section_header')
        current_row += 1
        
        # Frame metadata
        self.worksheet[f'A{current_row}'].value = 'Timestamp:'
        self.worksheet[f'B{current_row}'].value = f"{frame_data.get('timestamp', 0):.3f}s"
        self.worksheet[f'C{current_row}'].value = 'Frame Index:'
        self.worksheet[f'D{current_row}'].value = frame_data.get('frame_idx', 'N/A')
        current_row += 1
        
        # Add thumbnail if available - FIXED VERSION
        current_row = self._add_frame_thumbnail(frame_data, current_row)
        
        # Add measurements table
        current_row = self._add_measurements_table(frame_data, current_row)
        
        return current_row + 2  # Space between frames
    
    def _add_frame_thumbnail(self, frame_data: Dict, current_row: int) -> int:
        """Add frame thumbnail if available - FIXED to delay cleanup"""
        try:
            frame_id = frame_data.get('frame_id')
            
            if frame_id and self.session_manager:
                logger.info(f"Attempting to add thumbnail for frame {frame_id}")
                
                try:
                    # Get thumbnail bytes directly from session manager instead of HTTP request
                    thumbnail_bytes = self.session_manager.get_frame_thumbnail(frame_id)
                    
                    if thumbnail_bytes:
                        logger.info(f"Successfully got thumbnail for frame {frame_id} ({len(thumbnail_bytes)} bytes)")
                        
                        # Save thumbnail to temporary file - DON'T DELETE YET
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                            temp_file.write(thumbnail_bytes)
                            temp_thumbnail_path = temp_file.name
                        
                        # Add to cleanup list for later
                        self.temp_files.append(temp_thumbnail_path)
                        
                        # Verify the file was created
                        if os.path.exists(temp_thumbnail_path):
                            logger.debug(f"Temporary thumbnail file created: {temp_thumbnail_path}")
                            
                            # Add image to Excel
                            img = ExcelImage(temp_thumbnail_path)
                            img.width = 200
                            img.height = 150
                            self.worksheet.add_image(img, f'A{current_row}')
                            
                            logger.info(f"Successfully added thumbnail image to Excel at row {current_row}")
                            
                            # DON'T DELETE THE FILE HERE - will be cleaned up after Excel save
                            
                            # Adjust row heights for image
                            for row in range(current_row, current_row + 8):
                                self.worksheet.row_dimensions[row].height = 20
                            current_row += 8
                        else:
                            logger.error(f"Temporary file was not created: {temp_thumbnail_path}")
                            current_row += 2
                    else:
                        logger.warning(f"No thumbnail data found for frame {frame_id}")
                        current_row += 2
                        
                except Exception as e:
                    logger.warning(f"Failed to get thumbnail for frame {frame_id}: {e}")
                    current_row += 2
            else:
                if not frame_id:
                    logger.warning("No frame_id provided for thumbnail")
                if not self.session_manager:
                    logger.warning("No session manager provided for thumbnail access")
                current_row += 2
                
        except Exception as e:
            logger.error(f"Failed to add thumbnail: {e}")
            current_row += 2
        
        return current_row
    
    def _add_measurements_table(self, frame_data: Dict, current_row: int) -> int:
        """Add measurements data table"""
        # Table headers
        headers = ['Measurement Type', 'Value', 'Unit', 'Percentage Change/Closure']
        for col, header in enumerate(headers, 1):
            cell = self.worksheet.cell(row=current_row, column=col)
            cell.value = header
            self._apply_style(cell, 'sub_header')
        current_row += 1
        
        # Add measurements using pre-calculated percentages
        measurements = frame_data.get('measurements', {})
        calculated_percentages = frame_data.get('calculated_percentages', {})
        
        # Angle measurements
        if measurements.get('glottic_angle') is not None:
            percentage_text = self._format_percentage_value(
                calculated_percentages.get('glottic_angle_closure'),
                frame_data.get('is_baseline', False)
            )
            current_row = self._add_measurement_row(
                current_row, 'Glottic Angle', measurements['glottic_angle'], '°', percentage_text
            )
        
        if measurements.get('supraglottic_angle') is not None:
            percentage_text = self._format_percentage_value(
                calculated_percentages.get('supraglottic_angle_closure'),
                frame_data.get('is_baseline', False)
            )
            current_row = self._add_measurement_row(
                current_row, 'Supraglottic Angle', measurements['supraglottic_angle'], '°', percentage_text
            )
        
        # Area measurements
        if measurements.get('glottic_area') is not None:
            percentage_text = self._format_percentage_value(
                calculated_percentages.get('glottic_area_closure'),
                frame_data.get('is_baseline', False)
            )
            current_row = self._add_measurement_row(
                current_row, 'Glottic Area', measurements['glottic_area'], 'px²', percentage_text
            )
            
        if measurements.get('supraglottic_area') is not None:
            percentage_text = self._format_percentage_value(
                calculated_percentages.get('supraglottic_area_closure'),
                frame_data.get('is_baseline', False)
            )
            current_row = self._add_measurement_row(
                current_row, 'Supraglottic Area', measurements['supraglottic_area'], 'px²', percentage_text
            )
        
        # Distance ratio measurements
        distance_ratio = measurements.get('distance_ratio')
        if distance_ratio:
            percentage_text = self._format_percentage_value(
                calculated_percentages.get('distance_ratio_change'),
                frame_data.get('is_baseline', False)
            )
            current_row = self._add_measurement_row(
                current_row, 'Distance Ratio (X/Y)', distance_ratio.get('ratio_percentage', 0), '%', percentage_text
            )
            
            # Add component distances
            current_row = self._add_measurement_row(
                current_row, 'Horizontal Distance', distance_ratio.get('horizontal_distance', 0), 'px', 'N/A'
            )
            current_row = self._add_measurement_row(
                current_row, 'Vertical Distance', distance_ratio.get('vertical_distance', 0), 'px', 'N/A'
            )
        
        return current_row
    
    def _add_measurement_row(self, row: int, measurement_type: str, value: float, 
                           unit: str, percentage_change: str) -> int:
        """Add a single measurement row"""
        self.worksheet.cell(row=row, column=1).value = measurement_type
        self.worksheet.cell(row=row, column=2).value = f"{value:.2f}"
        self.worksheet.cell(row=row, column=3).value = unit
        self.worksheet.cell(row=row, column=4).value = percentage_change
        
        # Apply data cell styling
        for col in range(1, 5):
            self._apply_style(self.worksheet.cell(row=row, column=col), 'data_cell')
        
        return row + 1
    
    def _format_percentage_value(self, value: Optional[float], is_baseline: bool = False) -> str:
        """Format percentage value for Excel output"""
        if value is None:
            return 'N/A'
        if is_baseline:
            return '0.0%'
        return f"{'+' if value > 0 else ''}{value:.1f}%"
    
    def _apply_style(self, cell, style_name: str):
        """Apply predefined style to cell"""
        style = self.styles.get(style_name, {})
        if 'font' in style:
            cell.font = style['font']
        if 'fill' in style:
            cell.fill = style['fill']
        if 'alignment' in style:
            cell.alignment = style['alignment']
        if 'border' in style:
            cell.border = style['border']
    
    def _apply_final_formatting(self):
        """Apply final formatting to the worksheet"""
        # Auto-adjust column widths using column indices
        from openpyxl.utils import get_column_letter
        
        # Get the maximum column index
        max_column = self.worksheet.max_column
        
        for col_idx in range(1, max_column + 1):
            max_length = 0
            column_letter = get_column_letter(col_idx)
            
            # Iterate through all rows for this column
            for row_idx in range(1, self.worksheet.max_row + 1):
                cell = self.worksheet.cell(row=row_idx, column=col_idx)
                
                # Only process non-merged cells
                if not isinstance(cell, MergedCell):
                    try:
                        if cell.value and len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
        
            # Apply the column width
            if max_length > 0:
                adjusted_width = min(max_length + 2, 50)
                self.worksheet.column_dimensions[column_letter].width = adjusted_width
            else:
                # Set a minimum width for empty columns
                self.worksheet.column_dimensions[column_letter].width = 12


def create_excel_export(frames_data: List[Dict], baseline_frame_id: str = None, 
                       export_metadata: Dict = None, session_manager=None) -> io.BytesIO:
    """
    Convenience function to create Excel export
    
    Args:
        frames_data: List of frame data with pre-calculated percentages
        baseline_frame_id: ID of the baseline frame
        export_metadata: Additional export information
        session_manager: Session manager instance for direct thumbnail access
        
    Returns:
        io.BytesIO: Excel file as bytes buffer
    """
    engine = VideoExportEngine(session_manager=session_manager)
    return engine.create_excel_export(frames_data, baseline_frame_id, export_metadata)