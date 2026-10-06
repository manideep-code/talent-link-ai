import sys
import urllib.request
import os

# To parse docx pure python
import zipfile
import xml.etree.ElementTree as ET

def extract_docx(path):
    try:
        with zipfile.ZipFile(path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            PARA = WORD_NAMESPACE + 'p'
            TEXT = WORD_NAMESPACE + 't'
            
            paras = []
            for paragraph in tree.iter(PARA):
                texts = [n.text for n in paragraph.iter(TEXT) if n.text]
                if texts:
                    paras.append(''.join(texts))
            return '\n'.join(paras)
    except Exception as e:
        return f"Error reading {path}: {e}"

def main():
    docs_dir = r"c:\Users\V.S.PATEL\Desktop\talentlink\docs"
    docx_files = [f for f in os.listdir(docs_dir) if f.endswith(".docx")]
    
    for f in docx_files:
        full_path = os.path.join(docs_dir, f)
        text = extract_docx(full_path)
        
        out_path = os.path.join(docs_dir, f + ".txt")
        with open(out_path, "w", encoding="utf-8") as out_f:
            out_f.write(text)
        print(f"Extracted {f} to {out_path}")

if __name__ == "__main__":
    main()
