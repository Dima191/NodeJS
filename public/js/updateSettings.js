import {showAlert} from "./alerts";

//type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
    try {
        const newData = {...data};
        let photoFile = new FormData();
        if (newData.photo) {
            photoFile.append('photo', newData.photo);
            delete newData.photo;
        }

        console.log(JSON.stringify(newData));
        console.log(typeof photoFile, photoFile, JSON.stringify(photoFile));
        const url = type === 'password' ? 'updateMyPassword' : 'updateMe';
        const res = await fetch(`http://127.0.0.1:3000/api/v1/users/${url}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newData),
            photo: JSON.stringify(photoFile)
        })
        if (res.ok)
            showAlert('success', `${type.toUpperCase()} updated successfully`);
        else
            showAlert('error', 'Try again');
    } catch (err) {
        console.log(err);
    }
}