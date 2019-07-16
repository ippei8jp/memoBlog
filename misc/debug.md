---
title: debug
date: 2019-07-07
tags: ["debug", "jekyll"]
layout: debug
show_banner: false
---
# site変数
```
site = 
{{ site | inspect }}
```

# site.tags変数
```
site.tags = 
{{ site.tags | inspect }}
```

# site.tags のキー 一覧
{% assign tag_keys = "" | split: "|" %}
{% for item in site.tags %}
  {% assign tag_keys = tag_keys | push: item[0] %}
{% endfor %}

```
{{ tag_keys  | inspect }}
```

# site.posts[1]変数
```
site.posts[1] = 
{{ site.posts[1] | inspect }}
```
<!-- {% comment %}  HTMLのコメントだけだとLiquidの処理は止まらないので、コメント中にでっかいデータが出力されてしまう
# site.tags[0]変数

```
{{ site.tags["サンプル"] | inspect }}
```

# site.tags.keys変数

```
{{ site.tags.keys | inspect }}
```

# site.tags変数

```
{{ site.tags | inspect }}
```
# site.tags["サンプル"]変数

```
{{ site.tags["サンプル"] | inspect }}
```

# site.tags["サンプル"][0]変数

```
{{ site.tags["サンプル"][0] | inspect }}
```
# page.tags | array_to_sentence_string

```
{{ page.tags | array_to_sentence_string }}
```
{% endcomment %}-->
