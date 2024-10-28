import express from 'express';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import fs from "fs";
import path from "path";
import mongoose from 'mongoose';

const __dirname = path.resolve();

const app = express();

// file path
//const filePath = path.join(__dirname, "data", "writing.json"); // my_app/data/writing.json

// body parser set
app.use(bodyParser.urlencoded({ extended: false })); // express 기본 모듈 사용
app.use(bodyParser.json());

// view engine set
app.set('view engine', 'html'); // main.html -> main(.html)

// nunjucks setting
nunjucks.configure('views', {
    watch: true, // html 파일이 수정될 경우, 다시 반영 후 렌더링
    express: app // express가 어떤 객체를 나타내는지
});

// mongoose connect
mongoose.connect("mongodb://127.0.0.1:27017").then(() => console.log("DB 연결 성공")).catch((e) => console.error(e));

// mongoose setting
const { Schema } = mongoose;

const WritingSchema = new Schema({
    title: String,
    contents: String,
    date: {
        type: Date,
        default: Date.now,
    }
});

const Writing = mongoose.model("Writing", WritingSchema);

// middleware : request와 response 사이 뭔가를 하게함
// main page GET
app.get('/', async (req, res) => {
    /* const fileData = fs.readFileSync(filePath);
    const writings = JSON.parse(fileData); */

    let writings = await Writing.find({});

    res.render('main', { list: writings }); // nunjucks setting으로 views를 했기 때문에
});

app.get('/write', (req, res) => {
    res.render('write');
});

app.post('/write', async (req, res) => {
    const title = req.body.title;
    const contents = req.body.contents;

    //const date = req.body.date;

    // 데이터 저장
    // data/writing.json 안에 글 내용이 저장
    // readFile 사용하지 않고 readFileSync 사용 이유 : node.js 자체가 비동기이기 때문.. 
    /* const fileData = fs.readFileSync(filePath); // 파일 읽기

    const writings = JSON.parse(fileData); // 파일 변환

    // request 데이터를 저장
    writings.push({
        title: title,
        contents: contents,
        date: date,
    });

    // data/writing.json에 저장하기
    fs.writeFileSync(filePath, JSON.stringify(writings)); */

    // mongodb에 저장
    const writing = new Writing({
        title: title,
        contents: contents
    });
    const result = await writing.save().then(() => {
        console.log("Success");
        // todo
        res.render('detail/:id', { 'detail': { title: title, contents: contents, /* date: date */ } });
    }).catch((err) => {
        console.error(err);
        res.render("write");
    });

});

app.get('/detail/:id', async (req, res) => {
    const id = req.params.id;

    const detail = await Writing.findOne({_id: id})
    .then((result) => {
        res.render("detail", {"detail": result});
    })
    .catch((err) => {
        console.error(err);
    });

    //res.render('detail');
});

app.get('/edit/:id', async (req, res) => {
    const id = req.params.id;

    const edit = await Writing.findOne({ _id: id }).then((result) => {
        res.render('detail', { 'edit': result })
    }).catch((err) => {
        console.error(err)
    });
});

app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const contents = req.body.contents;

    const edit = await Writing.replaceOne({ _id: id }, { title: title, contents: contents }).then((result) => {
        console.log('update success')
        res.render('detail', { 'detail': { 'id': id, 'title': title, 'contents': contents } });
    }).catch((err) => {
        console.error(err)
    });
});

app.post('/delete/:id', async (req, res) => {
    const id = req.params.id;

    const delete_content = await Writing.deleteOne({_id: id})
    .then(() => {
        console.log('delete success');
        res.redirect('/');
    })
    .catch((err) => {
        console.error(err);
    });

})

app.listen(3000, () => {
    console.log('Server is running');
});