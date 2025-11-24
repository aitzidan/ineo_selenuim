require('dotenv').config();
const { default: axios } = require('axios');
const { json } = require('express');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');
const {OpenAI} = require('openai')
const openai = new OpenAI({
    apiKey : process.env.OPENAI_KEY
})

const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'dyesqjo44', 
  api_key: '254969816611227', 
  api_secret: '1IbSCuPGZoQmXD6LkkzRSczBAZs'
});

const uploadImageToCloudinary = async (imageBuffer) => {
return new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { resource_type: 'image' },
    (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.secure_url);
      }
    }
  );
  stream.end(imageBuffer);
});
};

const dataExtraction = async (req,res)=> {    
    const file = req.file;

    if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const imageUrl = await uploadImageToCloudinary(file.buffer);
      console.log(imageUrl);
      // const result = await axios.post('https://api.openai.com/v1/chat/completions', {
      //   model: 'gpt-4o-mini',
      //   messages: [
      //     {
      //       role: 'user',
      //       content: [
      //         {
      //           type: 'text',
      //           text: "Donner moi le type : [facture ou ticket] et Extraire le nom du fournisseur, l'adresse, numero de facture, date de facture, nom du client, montant HT, tva, total,devise , RC, ICE, et IF."
      //         },
      //         {
      //           type: 'image_url',
      //           image_url: {
      //             'url': imageUrl
      //           }
      //         }
      //       ]
      //     }
      //   ],
      //   max_tokens: 300
      // }, {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${apiKey}` // Correctly set the headers
      //   }
      // } );
      const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Donner moi le type : [facture ou ticket] et Extraire le nom du fournisseur, l'adresse, numero de facture, date de facture, nom du client, montant HT, tva, total,devise , RC, ICE, et IF." },
              {
                type: "image_url",
                image_url: {
                  "url": imageUrl,
                },
              },
            ],
          },
        ],
      });
      const resultFromGpt = response.choices[0].message.content;
      console.log('resultGPT : ', resultFromGpt);
      // console.log('json : ',jsonGenerator(resultFromGpt));
      
      res.status(200).send(resultFromGpt)
      
    } catch (error) {
      console.log(error);
      res.send({status : error.status, error : error.error.message}) 
    }
      
      
  }


  const dataExtractionBase64 = async (req,res)=> {   
    let base64Image = null;
    let myPrompt = "Donner moi le type : [facture ou ticket] et Extraire le nom du fournisseur, l'adresse, numero de facture, date de facture, nom du client, montant HT, tva, total,devise , RC, ICE, et IF."

    let myPrompt1 = "Veuillez analyser l'image ci-jointe et extraire les informations suivantes avec précision :\nType de document : (Indiquez si c'est une \"facture\", un \"ticket\").\nNom du fournisseur (le premier acteur) :\nNom du client (le deuxième acteur, ignorer le client final):\nAdresse du fournisseur (voir footer) :\nAdresse du client (peut-être en bas de son nom):\nNuméro de facture :\nDate de facture(au format DD/MM/YYYY) :\nDate d'échéance(au format DD/MM/YYYY) :\nMode de paiement (ou de réglement) :\nMontant HT:\nTVA:\nTotal:\nDevise:\nRC du fournisseur (voir footer):\nICE du fournisseur (voir footer):\nICE du client:\nIF du fournisseur (voir footer):\nMerci de formater la réponse de manière claire et organisée, en utilisant les labels ci-dessus pour chaque valeur extraite, ni plus, ni moins. Veuillez repondre avec 'Non spécifié' si une valeur est non disponible ou non spécifiée"
    console.log(myPrompt1.length);
    const file = req.file;

    if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype == 'application/pdf') {
      try {
        const { pdf } = await import("pdf-to-img");
        const fs = require('fs/promises');
        const pdfPath = req.file.buffer; 
        
        const document = await pdf(pdfPath, { scale: 2 });
        let counter = 1;
        for await (const image of document) {
          await fs.writeFile(`page${counter}.png`, image);
          counter++;
        }

        const imageBuffer = await fs.readFile('page1.png'); 
        base64Image = imageBuffer.toString('base64');

      } catch (error) {
          console.error('Error converting PDF:', error);
          res.status(500).json({ error: 'Failed to convert PDF', details: error.message });
      }
    }

    try {
      // const imageUrl = await uploadImageToCloudinary(file.buffer);
      // console.log(imageUrl);
      // const result = await axios.post('https://api.openai.com/v1/chat/completions', {
      //   model: 'gpt-4o-mini',
      //   messages: [
      //     {
      //       role: 'user',
      //       content: [
      //         {
      //           type: 'text',
      //           text: "Donner moi le type : [facture ou ticket] et Extraire le nom du fournisseur, l'adresse, numero de facture, date de facture, nom du client, montant HT, tva, total,devise , RC, ICE, et IF."
      //         },
      //         {
      //           type: 'image_url',
      //           image_url: {
      //             'url': imageUrl
      //           }
      //         }
      //       ]
      //     }
      //   ],
      //   max_tokens: 300
      // }, {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${apiKey}` // Correctly set the headers
      //   }
      // } );
      
      base64Image = base64Image ? base64Image : file.buffer.toString('base64')
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: myPrompt1 },
              {
                type: "image_url",
                image_url: {
                  "url": `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      });
      
      const resultFromGpt = response.choices[0].message.content;
      console.log('resultGPT : ', resultFromGpt);
      
      res.status(200).send(jsonGenerator(resultFromGpt))
      
    } catch (error) {
      console.log(error);
      if ('error' in error){
        res.send({status : error.status, error : error.error.message});
      }
      else 
        res.send(error);
    }
      
      
  }

  const dataExtractionFromPdf = async (req,res)=> {
   
    try {
      const uploadsDir = path.resolve('C:/Users/berra/Desktop/INEO/selenium/pdf_uploads');
      
      const filePath = path.join(uploadsDir, 'pdf1.pdf'); // Path to the saved file

      // Create a readable stream from the uploaded file
      const fileStream = fs.createReadStream(filePath);

      // Step 1: Upload the file to OpenAI
      const fileResponse = await openai.files.create({
        file: fileStream,
        purpose: "assistants" 
      });
      // console.log('File uploaded successfully:', fileResponse);
      const fileId = fileResponse.id;

      // step 2:
      // const assistant = await openai.beta.assistants.create({
      //   name: "Extracteur de Données",
      //   instructions: "Vous êtes un extracteur de données. Extraire la date(de la transaction et pas de la valeur), libelle, debit ou credit de chaque transaction de la facture PDF fournie.(aussi que le devise). dans cette format, par exemple: [\n    {\n        \"date\": \"12 09 2024\",\n        \"libelle\": \"TRANSFERTS : TRF04973606\",\n        \"debit\": null,\n        \"credit\": \"504.39\",\n        \"devise\": \"USD\"\n    }, ... }\n] ",
      //   tools: [{ type: "file_search" }],
      //   model: "gpt-4o"
      // });
      // const assistantId = assistant.id;
      // console.log('Assistant created:', assistantId);
      const assistantId = 'asst_q932pLZxx9NCPalxmKhPIkTE'
      // Step 3: Create a Thread for the Assistant
      const thread = await openai.beta.threads.create();
      const threadId = thread.id;
      // console.log('Thread created:', threadId);

      // Step 4: Send Message with Prompt and Attach PDF File
      const prompt = "Veuillez extraire les informations en format json";
      const messageResponse = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: prompt,
        attachments: [{ file_id: fileId, tools: [{ type: 'file_search' }] }],
      });
      // console.log('Message sent:', messageResponse);
      
      // Step 5: Run the Thread with Streaming
      let responseText = ''; // To accumulate the assistant's response

      const run = openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
      })
        .on('textCreated', (text) => {
          // process.stdout.write('\nassistant > ');
        })
        .on('textDelta', (textDelta, snapshot) => {
          // process.stdout.write(textDelta.value); // Write to the console
          responseText += textDelta.value; // Accumulate the response
        })
        .on('toolCallCreated', (toolCall) => {
          // process.stdout.write(`\nassistant > ${toolCall.type}\n\n`);
        })
        .on('end', async() => {
          await openai.files.del(fileId);
          // console.log("\nRun completed : ", responseText);
          if (responseText) {
            const jsonPart = responseText.match(/```json\n([\s\S]*?)```/);
            if (jsonPart.length>1) {
              // Parse the JSON string into a JavaScript object
            const jsonData = JSON.parse(jsonPart[1]);
            res.status(200).send(jsonData);
            }
            else {
              const jsonData = JSON.parse(jsonPart);
              res.status(200).send(jsonData);
            }
          }
        })
        .on('error', (error) => {
          if ('error' in error){
            res.status(500).send(error.error);
          }
          else 
            res.status(500).send(error);
        });
    } catch (error) {
      if ('error' in error){
        res.send(error.error);
      }
      else 
        res.send(error);
    }
    
  }


  const BankAlMaghribApi = async (req,res)=> { 
    const { devise, date } = req.query;
    if (!devise || !date) {
      res.send('Please send both the curremcy & the Date = YYYY-MM-DD')
      return
    }
    const apiUrl = 'https://api.centralbankofmorocco.ma/cours/Version1/api/CoursBBE';
    const subscriptionKeys = ['221d83380f86416e90d03578bb61dabf',
                              'd95aaada7cb948b2827233e976b5ee44',
                              'c122be3ef7924f7b9e44fb3fb8b58d8a',
                              '5cf229ef22dc454d8ecaf2c369a8ae9a',
                              '0324571c7c7340fe95124c67a3839f2d',
                              'd7855b4a9ca2442b9632b76ab586fcdc',
                              'c61db2c89b434852b0ddc926abb8bbb6',
                              '74c8efa5ad034afca5274adb2fc46a01'];
    const randomIndex = Math.floor(Math.random() * subscriptionKeys.length);
    try {
      const result = await axios.get(`${apiUrl}?libDevise=${devise}&date=${date}`,{
        headers: {
          'ocp-apim-subscription-key': subscriptionKeys[randomIndex]
        }
      } );
      res.status(200).send(result.data[0])
    } catch (error) {
      if (error.response.data) {
        if (error.response.data.statusCode) {
          res.status(error.response.data.statusCode).send(error.response.data)
        } else {
          res.send(error.response.data)
        }
      }
      else {
        res.send('Please contact the administrator')
      }
    }
    
  }

  function jsonGenerator(text) {
    let jsonObj = {};
    if(text.includes('ticket') || text.includes('Ticket') || text.includes('TICKET'))
      jsonObj.Type = 'Ticket';
    else if (text.includes('facture') || text.includes('Facture') || text.includes('FACTURE')) {
      jsonObj.Type = 'Facture';
    }
    else 
      jsonObj.Type = 'Autre';

    let newText = text.split('\n') 
    newText.filter((content)=>{ 
        if(nomFournisseurExist(content) && !('nomFournisseur' in jsonObj)) {
            let test = content.split(':')
            if (test[1].includes('*')) {
              let nom = test[1].replace(/[*]/g, '').trimStart()
              jsonObj.nomFournisseur = nom.trimEnd()
            } 
            else {
              let nom = test[1].trimStart()
              jsonObj.nomFournisseur = nom.trimEnd()
            } 
            if(nonExistant(test[1]))
                jsonObj.nomFournisseur = "Non spécifié";
        }
        if(nomClientExist(content) && !('nomClient' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*')) {
              let nom = test[1].replace(/[*]/g, '').trimStart()
              jsonObj.nomClient = nom.trimEnd()
            }
            else {
              let nom = test[1].trimStart()
              jsonObj.nomClient = nom.trimEnd()
            }
            if(nonExistant(test[1]))
                jsonObj.nomClient = "Non spécifié";
        }
        if(adresseFournisseurExist(content) && !('AdresseFournisseur' in jsonObj)) {
            let test =  content.split(':')
            
            if (test[1].includes('*')){
              let adresse = test[1].replace(/[*]/g, '').trimStart()
              jsonObj.AdresseFournisseur = adresse.trimEnd()
            }
            else {
              let adresse = test[1].trimStart()
              jsonObj.AdresseFournisseur = adresse.trimEnd()
            }
            if(nonExistant(test[1]))
                jsonObj.AdresseFournisseur = "Non spécifié";
        }
        if(adresseClientExist(content) && !('AdresseClient' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*')) {
              let adresse = test[1].replace(/[*]/g, '').trimStart()
              jsonObj.AdresseClient = adresse.trimEnd()
            }
            else {
              let adresse = test[1].trimStart()
              jsonObj.AdresseClient = adresse.trimEnd()
            }
            if(nonExistant(test[1]))
                jsonObj.AdresseClient = "Non spécifié";
        }
        if(modePaiementExist(content) && !('modePaiement' in jsonObj)) {
          let test =  content.split(':')
          if (test[1].includes('*')) {
            let mode = test[1].replace(/[*]/g, '').trimStart()
            jsonObj.modePaiement = mode.trimEnd()
          }
          else {
            let mode = test[1].trimStart()
            jsonObj.modePaiement = mode.trimEnd()
          }
          if(nonExistant(test[1]))
              jsonObj.AdresseClient = "Non spécifié";
      }
        if(numeroFactureExist(content) && !('numFacture' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*'))
              jsonObj.numFacture = test[1].replace(/[*]/g, '').trim()
            else
              jsonObj.numFacture = test[1].trim()
            if(nonExistant(test[1]))
              jsonObj.numFacture = "Non spécifié";
        }
        if(dateFactureExist(content) && !('dateFacture' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*'))
              jsonObj.dateFacture = test[1].replace(/[*]/g, '').trim()
            else
              jsonObj.dateFacture = test[1].trim()
            if(nonExistant(test[1]))
                jsonObj.dateFacture = "Non spécifié";
        }
        if(dateEcheanceExist(content) && !('dateEcheance' in jsonObj)) {
          let test =  content.split(':')
          if (test[1].includes('*'))
            jsonObj.dateEcheance = test[1].replace(/[*]/g, '').trim()
          else
            jsonObj.dateEcheance = test[1].trim()
          if(nonExistant(test[1]))
              jsonObj.dateEcheance = "Non spécifié";
      }
        if(montantHTExist(content) && !('montantHT' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes(','))
              test[1] = test[1].replace(',','.')
            if (test[1].includes('*')) {
              let montant = test[1].replace(/[*]/g, '').trimStart()
              jsonObj.montantHT = montant.trimEnd().trim()
              jsonObj.montantHT = jsonObj.montantHT.replace(/[^\d.]/g, '');
            }
            else {
              let montant = test[1].trimStart()
              jsonObj.montantHT = montant.trimEnd().trim()
              jsonObj.montantHT = jsonObj.montantHT.replace(/[^\d.]/g, '');
            }
            if(nonExistant(test[1]))
                jsonObj.montantHT = "Non spécifié";
        }
        if(TVAExist(content) && !('Tva' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes(','))
              test[1] = test[1].replace(',','.')
            if (test[1].includes('*')) {
              let tva = test[1].replace(/[*]/g, '').trimStart()
              jsonObj.Tva = tva.trimEnd().trim()
              jsonObj.Tva = jsonObj.Tva.replace(/[^\d.]/g, '');
            }
            else {
              let tva = test[1].trimStart()
              jsonObj.Tva = tva.trimEnd().trim()
              jsonObj.Tva = jsonObj.Tva.replace(/[^\d.]/g, '');
            }
            if(nonExistant(test[1]))
                jsonObj.Tva = "Non spécifié";
        }
        if(TotalExist(content) && !('Total' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes(','))
              test[1] = test[1].replace(',','.')
            if (test[1].includes('*')) {
              let total = test[1].replace(/[*]/g, '').trimStart()
              jsonObj.Total = total.trimEnd().trim()
              jsonObj.Total = jsonObj.Total.replace(/[^\d.]/g, '');
            }
            else {
              let total = test[1].trimStart()
              jsonObj.Total = total.trimEnd().trim()
              jsonObj.Total = jsonObj.Total.replace(/[^\d.]/g, '');
            }
            if(nonExistant(test[1]))
                jsonObj.Total = "Non spécifié";
        }
        if(DeviseExist(content) && !('Devise' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*')) {
              let devise = test[1].replace(/[*]/g, '').trimStart()
              jsonObj.Devise = devise.trimEnd()
            }
            else {
              let devise = test[1].trimStart()
              jsonObj.Devise = devise.trimEnd()
            }
            if(nonExistant(test[1]))
                jsonObj.Devise = "Non spécifié";
        }
        if(RC_FournisseurExist(content) && !('RC_Fournisseur' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*'))
              jsonObj.RC_Fournisseur = test[1].replace(/[.\*\-\s]/g, '')
            else
              jsonObj.RC_Fournisseur = test[1].replace(/[.\-\s]/g, '')
            if(nonExistant(test[1]))
                jsonObj.RC_Fournisseur = "Non spécifié";
        }
        // if(RC_ClientExist(content) && !('RC_Client' in jsonObj)) {
        //     let test =  content.split(':')
        //     if (test[1].includes('*'))
        //       jsonObj.RC_Client = test[1].replace(/[*]/g, '').trim()
        //     else
        //       jsonObj.RC_Client = test[1].trim()
        //     if(nonExistant(test[1]))
        //         jsonObj.RC_Client = "Non spécifié";
        // }
        if(ICE_FournisseurExist(content) && !('ICE_Fournisseur' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*'))
              jsonObj.ICE_Fournisseur = test[1].replace(/[.\*\-\s]/g, '')
            else
              jsonObj.ICE_Fournisseur = test[1].replace(/[.\-\s]/g, '')
            if(nonExistant(test[1]))
                jsonObj.ICE_Fournisseur = "Non spécifié";
        }
        if(ICE_ClientExist(content) && !('ICE_Client' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*'))
             jsonObj.ICE_Client = test[1].replace(/[.\*\-\s]/g, '')
            else
              jsonObj.ICE_Client = test[1].replace(/[.\-\s]/g, '')
            if(nonExistant(test[1]))
                jsonObj.ICE_Client = "Non spécifié";
        }
        if(IF_FournisseurExist(content) && !('IF_Fournisseur' in jsonObj)) {
            let test =  content.split(':')
            if (test[1].includes('*'))
              jsonObj.IF_Fournisseur = test[1].replace(/[.\*\-\s]/g, '')
            else
              jsonObj.IF_Fournisseur = test[1].replace(/[.\-\s]/g, '')
            if(nonExistant(test[1]))
                jsonObj.IF_Fournisseur = "Non spécifié";
        }
        // if(IF_ClientExist(content) && !('IF_Client' in jsonObj)) {
        //     let test =  content.split(':')
        //     if (test[1].includes('*'))
        //       jsonObj.IF_Client = test[1].replace(/[*]/g, '').trim()
        //     else
        //       jsonObj.IF_Client = test[1].trim()
        //     if(nonExistant(test[1]))
        //         jsonObj.IF_Client = "Non spécifié";
        // }
    })
    return jsonObj
  }

  
  function nonExistant(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('non spécifié') || LowerText.includes('non trouvé') || LowerText.includes('non disponible') || LowerText.includes('non fourni')
  }

  function nomFournisseurExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('nom') && LowerText.includes('fournisseur') && LowerText.includes(':')
  }
  function nomClientExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('nom') && LowerText.includes('client') && LowerText.includes(':')
  }
  function adresseFournisseurExist(text) {
    let LowerText = text.toLowerCase();
    return (LowerText.includes('adresse') || LowerText.includes('adress')) && LowerText.includes('fournisseur') && LowerText.includes(':')
  }
  function adresseClientExist(text) {
    let LowerText = text.toLowerCase();
    return (LowerText.includes('adresse') || LowerText.includes('adress')) && LowerText.includes('client') && LowerText.includes(':')
  }
  function numeroFactureExist(text) {
    let LowerText = text.toLowerCase();
    return (LowerText.includes('numéro') || LowerText.includes('numero') || LowerText.includes('num')) && LowerText.includes('facture') && LowerText.includes(':')
  }
  function dateFactureExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('date') && LowerText.includes('facture') && LowerText.includes(':')
  }
  function dateEcheanceExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('date') && (LowerText.includes('échéance') || LowerText.includes('echeance')) && LowerText.includes(':')
  }
  function modePaiementExist(text) {
    let LowerText = text.toLowerCase();
    return (LowerText.includes('paiement') || (LowerText.includes('reglement') || LowerText.includes('réglement'))) && LowerText.includes('mode') && LowerText.includes(':')
  }
  function montantHTExist(text) {
    let LowerText = text.toLowerCase();
    return (LowerText.includes('ht') || LowerText.includes('hors') || LowerText.includes('tax')) && LowerText.includes('montant') && LowerText.includes(':')
  }
  function TVAExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('tva') && LowerText.includes(':')
  }
  function TotalExist(text) {
    let LowerText = text.toLowerCase();
    return (LowerText.includes('total')||LowerText.includes('ttc')) && LowerText.includes(':')
  }
  function DeviseExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('devise') && LowerText.includes(':')
  }
  function RC_FournisseurExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('rc') && LowerText.includes('fournisseur') && LowerText.includes(':')
  }
  function RC_ClientExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('rc') && LowerText.includes('client') && LowerText.includes(':')
  }
  function ICE_FournisseurExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('ice') && LowerText.includes('fournisseur') && LowerText.includes(':')
  }
  function ICE_ClientExist(text) {
    let LowerText = text.toLowerCase();
    return LowerText.includes('ice') && LowerText.includes('client') && LowerText.includes(':')
  }
  function IF_FournisseurExist(text) {
    let LowerText = text.toLowerCase();
    return !LowerText.includes('adresse') && LowerText.includes('if') && LowerText.includes('fournisseur') && LowerText.includes(':')
  }
  function IF_ClientExist(text) {
    let LowerText = text.toLowerCase();
    return !LowerText.includes('adresse') && LowerText.includes('if') && LowerText.includes('client') && LowerText.includes(':')
  }

module.exports={dataExtraction,dataExtractionBase64,BankAlMaghribApi,dataExtractionFromPdf}