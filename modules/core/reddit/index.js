const request = require('request')
const cheerio = require('cheerio')
const sjcl = require('sjcl')
const compress = require('./deflate')
const Base64 = require('./Base64')

const baseUrl = 'https://gateway.reddit.com/desktopapi/v1/subreddits/QidianUnderground/search?sort=new&t=all&type=link&include_over_18=1&restrict_sr=1&q='

function getPosts(query, after) {
    return new Promise((resolve, reject) => {
        const afterString = after ? ('&after=' + after) : ''

        request({
            method: 'get',
            url: baseUrl + query + afterString,
            json: true
        }, (err, res, result) => {
            if (err) return reject(err)
            if (!result.postOrder) return reject ('no posts', result)
            const posts = result.postOrder
                .map(id => result.posts[id])
                .filter(({source}) => !!source && !!source.url && /\?.*=/.test(source.url))
                .map(({ source, title, created, id }) => ({ source: source.url, title, created, id }))

            resolve(posts)
        })
    })
}


async function loadPastebin(sources) {
    return Promise.all(sources.map(getPastebinContent))
}


function getPastebinContent (url) {
    return new Promise((resolve, reject) => {
        request.post({url, headers: {accept: 'application/json'}}, (err, res, result) => {
            try {
                const parsedResult = JSON.parse(result)
                const cipherdata = parsedResult.data
                resolve(extractPrivateBin(url, cipherdata))
            } catch (err) {
                console.log(err)
                resolve(false)
            }
        })
    })
}


function extractPrivateBin (source, cipherdata) {
    const data = sjcl.decrypt(source.split('#')[1], cipherdata)
    const cleartext = Base64.btou( compress.inflate( Base64.fromBase64(data) ) )
    return cleartext
}

module.exports = {
    getChapters: async (query, time) => {
        try {
            let posts = await getPosts(query)

            let firstOldPost = posts.findIndex(({created}) => created <= time)

            if (firstOldPost === 0) return []
            while (firstOldPost === -1) {
                const after = posts[posts.length - 1].id
                posts = posts.concat(await getPosts(query, after))
                firstOldPost = posts.findIndex(({created}) => created <= time)
            }

            const newPosts = posts.slice(0, firstOldPost)
            const chapters = await loadPastebin(newPosts.map(({source}) => source))
            return chapters.filter(chapter => chapter).reverse()
        }
        catch(err) {
            console.log(err)
            return []
        }
    }
}





