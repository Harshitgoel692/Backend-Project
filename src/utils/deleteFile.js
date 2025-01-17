export const deleteFile=asyncHandler(async (oldFileToBeDeleted) => {
    const public_id=oldFileToBeDeleted.split('/').pop().split('.')[0];
    console.log(public_id);
    
})