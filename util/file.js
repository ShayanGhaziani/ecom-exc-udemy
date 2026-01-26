const fs = require('fs');

const deleteFile = (filePath) => {
  if(filePath.match(/^(http|https):\/\//)) {
    // It's an external URL, do not attempt to delete
    console.log('External file URL, skipping deletion:', filePath);
    return;
  }
  fs.unlink(filePath, (err) => {
    if (err) { throw err; } 
    else { console.log('File deleted successfully'); }
  });
};

exports.deleteFile = deleteFile;