with open('E:/ChaoNous Blog/src/layouts/MainGridLayout.astro', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 检查 script 块内的括号匹配 (从第 265 行到第 788 行)
script_start = 264  # 0-indexed
script_end = 787    # 0-indexed

brace_count = 0
paren_count = 0
for i in range(script_start, script_end + 1):
    line = lines[i]
    for char in line:
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
        elif char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
    
    if brace_count < 0:
        print(f"Line {i+1}: Extra closing brace")
        break
    if paren_count < 0:
        print(f"Line {i+1}: Extra closing paren")
        break

print(f"Final brace count: {brace_count}")
print(f"Final paren count: {paren_count}")

# 查找问题行
if brace_count != 0 or paren_count != 0:
    print("\nSearching for issues...")
    for i in range(script_start, min(script_start + 50, script_end)):
        line = lines[i]
        if 'function' in line or '{' in line or '}' in line:
            print(f"Line {i+1}: {line.strip()[:80]}")
