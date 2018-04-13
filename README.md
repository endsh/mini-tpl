项目模版
=========

本项目用于快速创建一个新的小程序的基本目录结构。

    - 基础的小程序项目结构。
    - 支持gulp将less转化为wxss。
    - 基础的类库支持：user, loader, http, 还有一些便捷用法。

修改一下项目信息：

    1. 复制文件夹，命名成自己想要的文件，复制完成后记得删掉.git。
    2. 修改 package.json ，将 project 替换成为自己项目名称。
    3. 修改 dist/project.config.json 的 appid 、projectname 。

gulp 安装与编译：
```
    npm install # 安装gulp依赖
    gulp # 编译wxss并watch
```

user, loader, http 的用法介绍，暂时没空写文档。
