const fs = require('fs');

const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) { throw err; } 
    else { console.log('File deleted successfully'); }
  });
};

exports.deleteFile = deleteFile;