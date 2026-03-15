import re

with open('src/layouts/MainGridLayout.astro', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复第 514-520 行附近的问题
# 查找并删除错误的反引号和重复代码
old_pattern = r'''\t\t\t\t\tconst postListContainer = document\.getElementById\('post-list-container'\);
```
\t\t\t\t}
\t\t\t\t
\t\t\t\t// 同时更新文章列表容器的 CSS 类
\t\t\t\tconst postListContainer = document\.getElementById\('post-list-container'\);'''

new_code = """\t\t\t\t\tconst postListContainer = document.getElementById('post-list-container');"""

content = content.replace(old_pattern, new_code)

with open('src/layouts/MainGridLayout.astro', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed backtick issue")
