const express = require('express')
const app = express()
const fs = require('fs')
const multer = require('multer')
const { createWorker } = require('tesseract.js');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const PDFDocument = require('pdfkit');


const upload = multer({storage: storage}).single("avatar");
app.set('view engine', 'ejs');

app.get('/', (req,res) => {
    res.render('index');
});

app.post('/upload', (req,res) => {
    upload(req,res,err => {
        fs.readFile(`./uploads/${req.file.originalname}`, (err, data)=>{
            if(err) return console.log('This is an error', err)
            console.log(data);
            (async () => {
                const worker = await createWorker('eng', 1, {
                    logger: m => console.log(m), // Add logger here
                })
                const { data: { text, pdf } } = await worker.recognize(data, { pdfTitle: 'Example PDF' }, { pdf: true });
                console.log(text);
                // console.log('Generate PDF: tesseract-ocr-result.pdf');
                // doc.pipe(fs.createWriteStream('/path/to/file.pdf')); // write to PDF
                // doc.pipe(res);                                       // HTTP response
                const doc = new PDFDocument({
                    size: 'A4',
                    margin:50, 
                    // autoFirstPage: false
                });
                
                // doc.on('pageAdded', () => doc.text(req.file.originalname));
                doc.text(text)
                // .image(`./uploads/${req.file.originalname}`, 320, 145, {width: 200, height: 100})
                ;

                doc.pipe(fs.createWriteStream('tesseract-ocr-result.pdf')); // write to PDF
                // doc.pipe(res); 
                doc.end();

                // fs.writeFileSync('tesseract-ocr-result.pdf', Buffer.from(data));
                res.redirect('/download')
                // res.send(text)
                // await worker.terminate();
            })();
        })
    })
});

const PORT = 5000 || process.env.PORT;
app.listen(PORT, () => console.log('running'))

app.get('/download', (req,res) => {
    const file = `${__dirname}/tesseract-ocr-result.pdf`
    res.download(file)
})





