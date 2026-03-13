const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'dbdytwqtr', 
  api_key: '163862588422447', 
  api_secret: 'PeyyNPlNUmVMGcsX4rY9wawk2pg'
});

  const opts = {
    overwrite: true,
    invalidate: true,
    resource_type: "auto",
  };

module.exports = (image) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(image, opts, (error, result) => {
            if(result && result.secure_url) {
                return resolve(result.secure_url)
            }
            console.error(error.message)
            return reject({message: error.message})
        })
    })
}