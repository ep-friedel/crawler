const { readdir, readFile } = require('fs')
const { join } = require('path')
const pdf = require('parse-pdf')

function extractPdf (short) {
    return readPdf(short)
        .then((file) => pdf(file))
        .then((data) => {
            console.log(`parsed pdf file ${join(__dirname, '../../pdf', targetFile)}`)
            return extractPages(data)
        })
}

function readPdf (short) {
    return new Promise((resolve, reject) => {
        readdir(join(__dirname, '../../pdf'), (err, files) => {
            if (err) {
                return reject(err)
            }
            const targetFile = files.find(file => file.includes(`${short}.pdf`))
            if (!targetFile) {
                return reject('no file')
            }
            console.log(`found pdf file ${join(__dirname, '../../pdf', targetFile)}`)
            
            readFile(join(__dirname, '../../pdf', targetFile), (err, file) => {
                if (err) {
                    reject(err)
                }
                console.log(`read pdf file ${join(__dirname, '../../pdf', targetFile)}`)
                resolve(file)
            })
        })
    })
}

function extractPages (data, start = 0) {
    return data.pages.map((page, index) => {
        const id = index + 1 + start;
        const parsedText = page.text
            .replace(/\u{92}/gu, '\'')
            .replace(/\u{96}/gu, '-')
            .replace(/(\u{93}|\u{94})/gu, '"')
            .split('.')
            .reduce((text, sentence, index, arr) => {
                if (sentence.length) {
                    text += sentence + '.'
                }
                if (sentence[sentence.length - 1] !== '"' && arr[index + 1] && arr[index + 1].trim()[0] !== '"' && (sentence + arr[index + 1]).length > 150) {
                    text += '\n'
                }
                return text
            }, '')

        return `Page ${id}\n\n${parsedText}`
    })
}

module.exports = extractPdf