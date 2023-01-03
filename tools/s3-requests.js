require('dotenv').config()
const fs = require('fs')
const util = require('util')
const S3 = require('aws-sdk/clients/s3')

// S3 cconfig
const bucketName = process.env.AWS_BUCKET_NAME
const region     = process.env.AWS_BUCKET_REGION
const accessKey  = process.env.AWS_ACCESS_KEY
const secretKey  = process.env.AWS_SECRET_KEY

const s3 = new S3({
    credentials: {
        accessKeyId : accessKey,
        secretAccessKey: secretKey
    },
    region: region
})

// S3 Functions

async function getImage(key) {
    const params = {Bucket: bucketName , Key: key}

    return await s3.getObject(params).promise()
        .catch(error => console.error(error))

}

// INPUT postArray
// OUTPUT go through each post's blogArray => find images => attach file
async function fetchPostsImages(postArray) {
    if(postArray[0] === undefined) return;
    for(let postsIndex = 0; postsIndex < postArray.length; 
        postsIndex++) {
        for(let bodyIndex = 0; bodyIndex < 
            postArray[postsIndex]['body_array'].length; bodyIndex++) {
            
            const bodyArray = postArray[postsIndex]['body_array'];
            if(bodyArray[bodyIndex]['type'] === 'image') {
                bodyArray[bodyIndex]['file'] = 
                    await getImage(bodyArray[bodyIndex]['filename'])
            }
        }
    }
    console.log('end of fetchPostsImages' , postArray[0].body_array)
    return postArray
}

async function uploadImage(file) {
    const fileStream = fs.createReadStream(file.path)

    const uploadParams = {
        Bucket: bucketName, Body: fileStream, Key: file.filename
    }

    return s3.upload(uploadParams).promise()
}

// INPUT 3 arrays (image & text & caption) 
// OUPUT save images to s3 bucket; save image file names as objects

async function savePostArray(textArray , imageArray , captionArray , unlinkFile) {
    let textIndex    = 0; let imageIndex   = 0; const outputArray = [];
    if( !Array.isArray(textArray) ) textArray = [textArray];

    while( textIndex < textArray.length && textArray ) {
        if(textArray[textIndex] === '$image$') { // found image
            await uploadImage(imageArray[imageIndex])
            outputArray.push(
                { 'type': 'image' , 'filename': imageArray[imageIndex].filename , 
                    'caption': (Array.isArray(captionArray) ? 
                    captionArray[imageIndex] : captionArray) } )
            await unlinkFile(imageArray[imageIndex].path)
            imageIndex++
        } else { // found text
            outputArray.push( { 'type': 'text' , 'text': textArray[textIndex] } )
        }
        textIndex++
    }
    return outputArray
}

exports.fetchPostsImages = fetchPostsImages
exports.getImage    = getImage
exports.uploadImage = uploadImage
exports.savePostArray = savePostArray
