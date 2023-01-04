const express = require('express');
const router  = express.Router();
const DB = require('../tools/db-requests.js')
const multer = require('multer');
const { uploadImage , deleteFile } = require('../tools/s3-requests.js');
const upload = multer({dest: 'uploads/'})

const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)

const { savePostArray , getImage , fetchPostsImages} 
    = require('../tools/s3-requests.js');

// maps from '/posts/...'

router
    .post('/createblog' , async (req , res) => {
        DB.createBlog(req.body.author , req.body.title)
            .then(res.sendStatus(200))
            .catch(error => {console.log(error); res.sendStatus(500)})
    })
    .get('/blogsbyauthor' , async (req,res) => {
        DB.getBlogsByAuthor(req.query.author)
            .then(async result => {res.send(result).status(200)})
            .catch(error => {console.log(error); res.sendStatus(500)})
    })
    .get('/allblogs' , async (req,res) => { 
        DB.getAllBlogsAndPosts()
            .then(async result => {res.send(result).status(200)})
            .catch(error => {console.log(error); res.sendStatus(500)})
    })
    .post('/featureblog' , async (req , res) => {
        DB.featureBlog(req.body.blogID)
            .then(res.sendStatus(200))
            .catch(error => {console.log(error); res.sendStatus(500)})
    })
    .post('/createpost' , async (req ,res) => {
        DB.createPost( req.body.author , req.body.blogID ,
            Date.now() , req.body.title)
            .then(async result  => res.send(result))
            .catch(error => {console.log(error); res.sendStatus(500)})
    })
    .post('/createcomment' , async (req , res) => {
        DB.createComment(req.body.author , req.body.body , 
            req.body.timePosted , req.body.postID)
            .then(res.sendStatus(200))
            .catch(error => {console.log(error); res.sendStatus(500)})
    })
    .get('/postsbyblogid' , async (req,res) => {
        DB.getPostsByBlogID(req.query.id)
            .then(async result => {
                // console.log('/postsbyblogid' ,await fetchPostsImages(result.rows))
                // console.log('result' , result)
                res.send(await fetchPostsImages(result.rows))
            })
            .catch(error => {console.error(error); res.sendStatus(500)})
    })
    .get('/postbypostid' , async (req,res) => {
        DB.getPostByPostID(req.query.postID)
            .then(async result => {
                // console.log('/postbypostid' , result)
                res.send(await fetchPostsImages(result.rows))
            })
            .catch(error => {console.error(error); res.sendStatus(500)})
    })  
    .get('/commentsbypostid' , async (req , res) => {
        DB.getCommentsByPostID(req.body.postID)
            .then(async result => {res.send(result).status(200)})
            .catch(error => {console.log(error); res.sendStatus(500)})
    })
    .post('/updatepostarray' , upload.array('array'), async (req , res) => {
        // console.log('/updatepostarray' , '[array]' , req.body['array'] , 
        //     'req.files' ,req.files, '[caption]' , req.body['caption'] )
        savePostArray(req.body['array'] , req.files , req.body['text'] , unlinkFile)
            .then(async result => {
                // console.log('savePostArray result: ' , result)
                DB.updatePostArray(result , req.body['postID'])
            })
            .then(res.sendStatus(200))
            .catch(error => {console.error(error);})
    }) 

module.exports = router;