const cheerio       = require('cheerio')
const striptags     = require('striptags')
const request       = require('request')

const baseUrl = 'https://www.wuxiaworld.co/'

const urlRegex = /(\d*\.html)/
let count = 0

function parseChapter(html) {
    const $ = cheerio.load(html);
    $('#content script').remove();
    const rawHtml = $('#content').html()
    const text = striptags(rawHtml, ['br'])
    const header = $('.bookname > h1').html()
    const nextChapterLink = $('#pager_next').attr('href')

    return {
        chapter: `<h1>${header}</h1>${text.replace(/^\s*[\r\n]/gm, '')}`,
        nextChapterLink
    }
}

function crawl({currentLink, bookId, minChapterLength, short}, chapters = [], isNew = false) {
    return fetchChapter(baseUrl + bookId + '/' + currentLink)
        .then(({ chapter, nextChapterLink }) => {
            const isValid = chapter.length > minChapterLength
            if (isNew && isValid) {
                count++
                chapters.push(chapter)
            }
            if (isValid && count < 100 && urlRegex.test(nextChapterLink)) {
                return crawl({ currentLink: nextChapterLink, bookId, nextChapterLink, minChapterLength }, chapters, true)
            }
            count = 0
            return { chapters, currentLink }
        })
        .catch((err) => {
            console.warn(err)
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
