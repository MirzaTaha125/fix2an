
import re

def check_structure(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments
    content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    # Brackets and JSX Tags
    bracket_stack = []
    tag_stack = []
    
    pairs = {'(': ')', '{': '}', '[': ']'}
    
    lines = content.split('\n')
    
    # Simple state machine for parsing
    in_tag = False
    current_tag = ""
    is_closing = False
    is_self_closing = False
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        j = 0
        while j < len(line):
            char = line[j]
            
            if not in_tag:
                if char == '<' and j + 1 < len(line) and (line[j+1].isalpha() or line[j+1] == '/'):
                    in_tag = True
                    is_closing = line[j+1] == '/'
                    j += 1 if is_closing else 0
                    current_tag = ""
                elif char in pairs:
                    bracket_stack.append((char, line_num))
                elif char in pairs.values():
                    if not bracket_stack:
                        print(f"Extra closing {char} at line {line_num}")
                    else:
                        top, open_line = bracket_stack.pop()
                        if pairs[top] != char:
                            print(f"Bracket Mismatch: {top} from line {open_line} closed by {char} at line {line_num}")
            else:
                if char == '>':
                    in_tag = False
                    is_self_closing = line[j-1] == '/'
                    tag_name = current_tag.split()[0].rstrip('/')
                    
                    if not is_self_closing and tag_name:
                        if is_closing:
                            if not tag_stack:
                                print(f"Extra closing tag </{tag_name}> at line {line_num}")
                            else:
                                top, open_line = tag_stack.pop()
                                if top != tag_name:
                                     print(f"Tag Mismatch: <{top}> from line {open_line} closed by </{tag_name}> at line {line_num}")
                        else:
                            # Only track certain tags to reduce noise from components that might be self-closing but not marked as such
                            if tag_name[0].islower() or tag_name in ['Navbar', 'Skeleton', 'Button', 'Link', 'Camera', 'Shield', 'FileText', 'MoreVertical', 'Footer', 'AlertCircle', 'Clock', 'XCircle', 'CheckCircle', 'Calendar', 'X', 'Dialog', 'DialogContent', 'DialogTitle', 'DialogDescription', 'Card', 'CardContent', 'Eye', 'DialogHeader', 'DialogFooter']:
                                tag_stack.append((tag_name, line_num))
                else:
                    current_tag += char
            j += 1

    for char, line_num in bracket_stack:
        print(f"Unclosed bracket {char} from line {line_num}")
    for tag, line_num in tag_stack:
        print(f"Unclosed tag <{tag}> from line {line_num}")

check_structure('j:/work/Fixa2an-main/fixa2an-main/Frontend/src/pages/MyCasesPage.jsx')
