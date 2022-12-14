var http = require("http");
var fs = require("fs");
var url = require("url");
var port = process.argv[2];

if (!port) {
    console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？");
    process.exit(1);
}

var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true);
    var pathWithQuery = request.url;
    var queryString = "";
    if (pathWithQuery.indexOf("?") >= 0) {
        queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
    }
    var path = parsedUrl.pathname;
    var query = parsedUrl.query;
    var method = request.method;

    /******** 从这里开始看，上面不要看 ************/
    const session = JSON.parse(fs.readFileSync('./session.json').toString())

    console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery);

    if (path === "/sign_in" && method === "POST") {
        const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
        // 点击发送请求,将用户名和用户密码存入空数组
        const array = [];
        request.on("data", chunk => {
            array.push(chunk);
        });
        request.on("end", () => {
            // Buffer把不同数据合成一个字符串
            const string = Buffer.concat(array).toString();
            const obj = JSON.parse(string); // name password
            // 查看数据库里面的用户名和密码是否匹配
            const user = userArray.find(
                user => user.name === obj.name && user.password === obj.password
                // console.log(user)
                // 如果不匹配 响应状态码设置为400 
            );
            if (user === undefined) {
                response.statusCode = 400;
                response.setHeader("Content-Type", "text/json; charset=utf-8");
            } else {
                response.statusCode = 200;
                const random = Math.random()
                session[random] = { user_id: user.id }
                // 用cookie标记，httponly防止前端修改cookie
                fs.writeFileSync('./session.json', JSON.stringify(session))
                response.setHeader("Set-Cookie", `session_id=${random}; HttpOnly`);
            }
            response.end()
        });
        //用户登录成功之后 
    } else if (path === "/home.html") {
        // 写不出来
        const cookie = request.headers["cookie"];
        let sessionId;
        try {
            // 获得包含user.id数字的字符，存为sessionId
            sessionId = cookie
                .split(";")
                .filter(s => s.indexOf("session_id=") >= 0)[0]
                .split("=")[1];
        } catch (error) { }
        if (sessionId && session[sessionId]) {
            const userId = session[sessionId].user_id
            const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
            // 两个字符串相比较
            const user = userArray.find(user => user.id === userId);
            const homeHtml = fs.readFileSync("./public/home.html").toString();
            let string = ''
            if (user) {
                string = homeHtml.replace("{{loginStatus}}", "已登录")
                    .replace('{{user.name}}', user.name)
            }
            response.write(string);
        } else {
            const homeHtml = fs.readFileSync("./public/home.html").toString();
            const string = homeHtml.replace("{{loginStatus}}", "未登录")
                .replace('{{user.name}}', '')
            response.write(string);
        }
        response.end()
    } else if (path === "/register" && method === "POST") {
        //设置 响应头的编码格式
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        // 首先读取数据库
        const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
        const array = [];
        // 点击发送请求,将数据存入空数组
        request.on("data", chunk => {
            array.push(chunk);
        });
        request.on("end", () => {
            // Buffer把不同数据合成一个字符串
            const string = Buffer.concat(array).toString();
            const obj = JSON.parse(string);
            // 数据库最后一个数据
            const lastUser = userArray[userArray.length - 1];
            const newUser = {
                // 如果数据库不是空的,就最后一个数据id加1
                // 如果是空的,则为第一个
                id: lastUser ? lastUser.id + 1 : 1,
                name: obj.name,
                password: obj.password
            };
            userArray.push(newUser);
            // 记得读取和写入json时,文件格式都是字符串形式
            fs.writeFileSync("./db/users.json", JSON.stringify(userArray));
            response.end()
        });
    } else {
        response.statusCode = 200;
        // 如果path是/则换为/index.html。不是则是path
        // 默认首页
        const filePath = path === "/" ? "/index.html" : path;
        // 获得路径文件后缀.的位置
        const index = filePath.lastIndexOf(".");
        // suffix 是后缀
        const suffix = filePath.substring(index);
        // 利用哈希表存储所有的后缀格式
        const fileTypes = {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "text/javascript",
            ".png": "image/png",
            ".jpg": "image/jpeg"
        };
        // 利用哈希表
        // 当路径名you.html 则setHeader更改为text/html
        response.setHeader(
            "Content-Type",
            `${fileTypes[suffix] || "text/html"};charset=utf-8`
        );
        let content;
        // try catch捕捉错误
        // 如果content存在则继续执行，如果不存在则是错误，返回文件不存在
        try {
            content = fs.readFileSync(`./public${filePath}`);
        } catch (error) {
            content = "文件不存在";
            response.statusCode = 404;
        }
        response.write(content);
        response.end();
    }

    /******** 代码结束，下面不要看 ************/
});

server.listen(port);
console.log(
    "监听 " +
    port +
    " 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
    port
);