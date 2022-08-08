
const FORM_URL = "https://6-22.pages.dev/"

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url)
  if (url.pathname === "/submit") {
    return submitHandler(request)
  }

  return Response.redirect(FORM_URL)
}



const submitHandler = async request => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405
    })
  }
  let reqBody = await request.formData()
  //console.log(body)

  const {
    file,
    email,
    test
  } = Object.fromEntries(reqBody)
  var fileOfBlob = new File([file], 'aFileName.mp4')

  console.log(email)



  let res = await fetch(`https://www.filestackapi.com/api/store/S3?key=${FILESTACK_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'video/mp4'
    },
    body: fileOfBlob
  })

  let response = await res.json()
  let url = response.url
  // let urlBody = {
  //   fields:{
  //     theVideo: url
  //   }
  // }
  //
  //
  // // send the url in filestack to airtable
  // console.log("airtable log:" + await createAirtableRecord({body:urlBody,tableName:"video"}))

  // sent post to assemblyai to get the trans_id
  let trans_id = await uploadToAssembly({url:url})
  let id = trans_id.id
  console.log("id Log:" + id)


  // get the trans_res from AssemblyAI
  let trans_res = await transFromAssembly({id:id})
  let trans_status= trans_res.status
  let count = 0;
  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  while(trans_status !== 'completed' && count <= 50){
    //await new Promise(resolve => setTimeout(resolve, {timeout:10000}));
     await Promise.all([
      timeout(2000)
    ]);
    trans_res = await transFromAssembly({id:id});
    trans_status= trans_res.status;
    console.log("waiting");
    count++;
  }
  console.log(trans_res.status);
  let trans_text = trans_res.text;
 // console.log(trans_res)


  //upload the result to airtable
  let textBody = {
    fields:{
      userName: email,
      theVideo: url,
      transText: trans_text
    }
  }

  await createAirtableRecord({body:textBody,tableName:"video"})



  return Response.redirect(FORM_URL)

}

async function createAirtableRecord ({body,tableName}) {
  return fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-type': `application/json`
    }
  })
}


async function uploadToAssembly({url}){
  console.log("url is:"+url)
  let body = {
    'audio_url': url
  }
  let res = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': `${ASSEMBLY_API_TOKEN}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });
 let resJson = await res.json();
  console.log(resJson);
  return resJson;
}

async function transFromAssembly({id}){
  let res = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
    headers: {
      'authorization': `${ASSEMBLY_API_TOKEN}`,
      'content-type': 'application/json'
    }
  });
  let resJson = await res.json();
  console.log(resJson);
  return resJson;

}

async function uploadToAirtable({body,tableName}){
  return fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-type': `application/json`
    }
  })
}






// fetch the trans text from airtable
// async function getTransText({}){
//   return fetch('https://api.airtable.com/v0/appbBlzbiABwmEpy3/video/rec5HzKeEO7GNP9eZ', {
//     headers: {
//       'Authorization': `Bearer ${AIRTABLE_API_KEY}`
//     }
//   });
//
//
// }




































