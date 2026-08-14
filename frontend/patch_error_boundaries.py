import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<ResponsiveContainer' not in content:
        return

    # Check if already imported
    if 'ComponentErrorBoundary' in content:
        return

    print(f"Patching {filepath}")

    # Determine import path depth based on how many directories deep we are in src/pages/
    # e.g. frontend/src/pages/analyst/AnalystDwellTime.jsx -> depth 2 -> "../../components/ComponentErrorBoundary"
    # frontend/src/pages/analyst/modules/RetailAnalystModules.jsx -> depth 3 -> "../../../components/ComponentErrorBoundary"
    
    rel_path = os.path.relpath(filepath, start=os.path.join("c:\\Users\\feros\\OneDrive\\Desktop\\project\\Consumer_Attention_Mapping_System\\frontend\\src\\pages"))
    depth = len(rel_path.split(os.sep))
    import_path = "../" * depth + "components/ComponentErrorBoundary"
    
    import_stmt = f'import ComponentErrorBoundary from "{import_path}";\n'

    # Insert import statement after the last import
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i

    lines.insert(last_import_idx + 1, import_stmt)
    new_content = '\n'.join(lines)

    # Wrap ResponsiveContainer
    new_content = new_content.replace('<ResponsiveContainer', '<ComponentErrorBoundary>\n<ResponsiveContainer')
    new_content = new_content.replace('</ResponsiveContainer>', '</ResponsiveContainer>\n</ComponentErrorBoundary>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

def main():
    pages_dir = r"c:\Users\feros\OneDrive\Desktop\project\Consumer_Attention_Mapping_System\frontend\src\pages"
    for root, dirs, files in os.walk(pages_dir):
        for file in files:
            if file.endswith(".jsx"):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
