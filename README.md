# GobathAPI.js

GoBath.ru Javascript SDK

const API = GobathApi({});

```typescript
Events.on('error', error => {
    console.log('Globally catched '+error.message)
})
import fs from "fs"
import FormData from 'form-data';

// const {user_id}  = await API.Profile.GET();
// const {updated}  = await API.Profile.PATCH({name: 'asd'});
// const {file}     = await API.Profile.Avatar.GET();
// const {note}     = await API.Profile.Avatar.PATCH({file_name: 'asd'}, {file_id: 'asd'});
// const {}         = await API.Profile.Password.PATCH({old_password: 'asd', new_password: 'zxc'});
// const {redirect} = await API.Profile.SSO.Yandex.LINK();
// const {}         = await API.Profile.SSO.Yandex.UNLINK({});
// const {sent}     = await API.Auth.MagickLink.GET(null, {via: "phone", destination: "12345"});
// const {variants} = await API.File['d87e403b-165e-4260-8e20-b2e899e3b730'].GET(null, {redirect: true});
try {
    const form = new FormData();
          form.append('my_file', fs.createReadStream('C:/Users/Haikson/Downloads/vhost.txt'))

    const r = await API.Upload.POST(form, {onProgress: console.log})
    console.log(r)
} catch (e: any) {
    // e.preventDefault()
    console.log(['Catched', e.isPreventedDefault, e])
}
```

