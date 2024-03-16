import fs from 'fs'


export const deleteLocalFile=(localFilePath) =>{
    if(fs.existsSync(localFilePath)){
        fs.unlinkSync(localFilePath,(err)=>{
            throw err;
        })
    }else{
        console.log(localFilePath,'Not exists!');
    }
}


