# sketch-hback-plugin

## Description

### en

todo...

### ja

Sketchでアートボードをヒストリーバックで移動できるようにするプラグインです。複数のアートボードを行き来するのが簡単にできるようになります。

## Features

- Artboard bookmark (save / load)
- Artboard History Back and Forward

![demo](https://github.com/YusukeKokubo/sketch-hback-plugin/blob/master/hback-demo.gif?raw=true)

## Requirements

- Sketch 41.2 +
  - using ArtboardChanged action.
- macOS Yosemite+


## Install

download or git clone from repository to plugin directory of Sketch.

`~/Library/Application Support/com.bohemiancoding.sketch3/Plugins/`

## How to use

1. open a Sketch document.
1. artboard changed somethimes.
1. push command + [ .
  - You can go back.
1. push command + ] .
  - You can go forward.
  