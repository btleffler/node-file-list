# Node File List
## Do what other web servers can do by default!

```
$ npm install file-list -g
$ cd ~/path/to/awesome/files
$ file-list serve -p 8080
```

That's it! If you don't want to run the command from the root directory, you can set it per instance with the optional ``-r`` flag for ``serve``, otherwise it defaults to the directory it was called from.

By default, file-list won't list hidden files. This can be changed by the optional ``--showHidden`` flag for ``serve``.

```
$ cd ~/path/to/awesome/files
$ file-list serve --showHidden
```

*This only affects systems that mark hidden files by a preceding '.' as node doesn't have the ability to tell whether a file is hidden or not in Windows systems.*

You can call it from inside your node application too.
```
var file-list = require("file-list");
file-list.startServer(root, port, showHiddenFiles);
```

The ``startServer`` method also accepts a parameter to define the root directory of that instance. If you leave it out, it will default to the current working directory.

# LICENSE - MIT
Copyright (c) 2013 Benjamin Leffler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
