import sys
import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path):
    """
    Extracts all text from a given PDF file and prints it to standard output.
    """
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n" # Add newline between pages
        print(full_text)
    except Exception as e:
        print(f"Error processing PDF file at {pdf_path}: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if 'doc' in locals() and doc:
            doc.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 pdf_extractor.py <path_to_pdf>", file=sys.stderr)
        sys.exit(1)
    
    pdf_file_path = sys.argv[1]
    extract_text_from_pdf(pdf_file_path)