import multer from "multer";

// we are using diskstaorage nor memory staorage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public /temp')
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({storage })

  
  