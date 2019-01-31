const cheerio       = require('cheerio')
const striptags     = require('striptags')
const request       = require('request')

const baseUrl = 'https://www.wuxiaworld.co/'

const urlRegex = /\/(\d*)\.html/


function parseChapter(html) {
    const $ = cheerio.load(html);
    const rawHtml = $('#content').html()
    const text = striptags(rawHtml, ['br'])
    const header = $('.bookname > h1').html()
    const nextChapterLink = $('#pager_next').attr('href')

    return {
        chapter: `<h1>${header}</h1><br><br>${text}`,
        nextChapterLink
    }
}

function crawl(currentLink, bookId, chapters = []) {
    fetchChapter(baseUrl + bookId + '/' + currentLink)
        .then(({ chapter, nextChapterLink }) => {
            if (urlRegex.test(nextChapterLink)) {
                chapters.push(chapter)
                return crawl(nextChapterLink, bookId, chapters)
            }
            return { chapters, currentLink }
        })
        .catch((err) => {
            console.log(err)
            return { chapters, currentLink }
        })
}

function fetchChapter (url) {
    return new Promise((resolve, reject) => {
        request({
            method: 'get',
            url
        }, (err, res, result) => {
            if (err || !result) return reject(err || 'no content')
            resolve(parseChapter(result))
        })

    })
}

module.exports = (currentLink, bookId) => crawl(currentLink, bookId)
