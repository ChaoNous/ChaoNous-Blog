with open('E:/ChaoNous Blog/src/layouts/MainGridLayout.astro', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. 删除第 515-519 行（反引号和重复代码）- 索引 514-518
# 2. 删除第 530 行的 `})();` (删除后变成第 525 行)
# 3. 在 script 结束前添加 `})();`

# 第一步：删除第 515-519 行（索引 514-518）
del lines[514:519]

# 第二步：删除原第 530 行，现在是第 525 行（索引 524）
# 检查是否是 `})();`
if '})();' in lines[524]:
    del lines[524]

# 第三步：找到 `</script>` 并在此之前添加 `})();`
for i in range(len(lines)):
    if '</script>' in lines[i]:
        lines.insert(i, '\t})();\n')
        break

with open('E:/ChaoNous Blog/src/layouts/MainGridLayout.astro', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed!")
