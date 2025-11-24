const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const tesseract = require('tesseract.js')
const Company = require('../dataBaseFiles/companySchema');


const getICE = async(req,res)=>{
    const ICE = req.params.key;
    let result;
    const company = await Company.findOne({identifiantCommunEntreprise : ICE});

    if (company) {
        res.status(200).send(company);
    }
    else{
        do {
            result = await ICE_case(ICE);
            if (result.backup=== true) {
                do {
                    result = await ICE_Backup(ICE)
                    if (result.backup === false) {
                        res.status(406).send('Invalid ICE')
                        return;
                    }
                    if (result.Backuperror){
                        res.status(500).send(`Problem in the server : ${result.error}`);
                        return;
                    }
                } while (result.name==='');
            }
                
            if (result === false) {
                res.status(406).send('Invalid ICE')
                return;
            }
            if (result.error){
                res.status(500).send(`Problem in the server : ${result.error}`);
                return;
            }
        } while (result.name==='');
        
        if (result.name) {
            await Company.create({
                name: result.name,
                activity: result.activity,
                identifiantFiscale: result.identifiantFiscale,
                identifiantCommunEntreprise : ICE,
                centreRc: result.centreRc,
                numeroRc: result.numeroRc,
                adresse: result.adresse,
                regimeImposition: result.regimeImposition
            })
            .then((newC)=>console.log('company added Successfully : ',newC))
            .catch((error)=>console.log('Error creating company : ',error))
            res.status(200).send(result);
        }
        
    }
}

const putICE = async(req,res)=>{
    const ICE = req.params.key;
    let result;

    do {
        result = await ICE_case(ICE);
        if (result.backup=== true) {
            do {
                result = await ICE_Backup(ICE)
                if (result.backup === false) {
                    res.status(406).send('Invalid ICE')
                    return;
                }
                if (result.Backuperror){
                    res.status(500).send(`Problem in the server : ${result.error}`);
                    return;
                }
            } while (result.name==='');
        }
            
        if (result === false) {
            res.status(406).send('Invalid ICE')
            return;
        }
        if (result.error){
            res.status(500).send(`Problem in the server : ${result.error}`);
            return;
        }
    } while (result.name==='');
        
        if (result.name) {
            await Company.findOneAndUpdate({identifiantCommunEntreprise : ICE},
                { 
                $set :{
                    name: result.name,
                    activity: result.activity,
                    identifiantFiscale: result.identifiantFiscale,
                    identifiantCommunEntreprise : ICE,
                    centreRc: result.centreRc,
                    numeroRc: result.numeroRc,
                    adresse: result.adresse,
                    regimeImposition: result.regimeImposition
                    }
            }, { new: true })
            .then((newC)=>console.log('company updated Successfully : ',newC))
            .catch((error)=>console.log('Error updating company : ',error))
            res.status(200).send(result);
        }
        
}

// app.get('/if/:key',async(req,res)=>{
//     const IF = req.params.key;
//     let result;
//     const company = await Company.findOne({identifiantFiscale : IF});

//     if (company) {
//         res.status(200).send(company);
//     }
//     else{
//         do {
//             result = await IF_case(IF);
//             if (result === false) {
//                 res.status(406).send('Invalid IF')
//             }
//         } while (result.name==='');
        
//         if (result.name) {
//             await Company.create({
//                 name: result.name,
//                 activity: result.activity,
//                 identifiantFiscale: result.identifiantFiscale,
//                 // identifiantCommunEntreprise : ICE,
//                 centreRc: result.centreRc,
//                 numeroRc: result.numeroRc,
//                 adresse: result.adresse,
//                 regimeImposition: result.regimeImposition
//             })
//             .then((newC)=>console.log('company added Successfully : ',newC))
//             .catch((error)=>console.log('Error creating company : ',error))
//             res.status(200).send(result);
//         }
        
//     }

// })



async function ICE_case(ICE) {
    console.log('Normal Ice');
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.3",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.3",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.3",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.3",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 OPR/113.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OpenWave/93.4.3888.3",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Safari/537.3",
    ];
   
    const options = new chrome.Options();
        // options.set('excludeSwitches', ['enable-automation']);
        // options.set('useAutomationExtension', false);
        options.addArguments('--disable-blink-features=AutomationControlled');
        options.addArguments(`user-agent=${userAgents[Math.floor(Math.random() * userAgents.length)]}`);
        options.addArguments('--no-sandbox');
        options.addArguments('--headless');
        options.addArguments('--disable-dev-shm-usage');
        // options.addArguments('--disable-gpu');
        options.addArguments('--disable-extensions'); 
        options.addArguments('--profile-directory=Default');
        options.addArguments('--incognito');
        options.addArguments('--disable-plugins-discovery');
        options.addArguments("--start-maximized");
        // options.addArguments(`--proxy-server=http://101.66.67.211:9002`);
        // options.addArguments('--user-data-dir=C:\\Users\\berra\\AppData\\Local\\Google\\Chrome\\User Data\\Default');

        //2nd options
        // options.addArguments('--disable-blink-features=AutomationControlled');
        // options.addArguments('--no-sandbox');
        // options.addArguments('--headless');
        // options.addArguments('--disable-dev-shm-usage');
        // options.addArguments('--disable-gpu');
        // options.addArguments('--disable-extensions'); 


    const driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
    const actions = driver.actions({async: true});
    let result = {};
    let warning;
    let warningIndex;
  try {

    try {
        await driver.get('https://r-entreprise.tax.gov.ma/rechercheentreprise/result');
        await driver.executeScript('window.scrollBy(0, 200);');
    } catch (error) {
        result.error = 'can\'t access website'
        result.backup = true;
        return result;
    }
    
    await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    
    
    try {
        await sleep(Math.random() * (1000 - 500) + 500);
        let element = await driver.findElement(By.id("iceRadio"));
        await actions.move({ origin: element }).perform();
        await element.click();
    } catch (error) {
        result.error = 'iceRadio'
        result.backup = true;
        return result;
    }

    try {
        await sleep(Math.random() * (1000 - 500) + 500);
        let element = await driver.findElement(By.id("mCriteria"));
        await actions.move({ origin: element }).perform();
        await element.sendKeys(ICE);
    } catch (error) {
        result.error = 'mCriteria'
        return result;
    }

    let element;
    try {
        element = await driver.findElement(By.id("captcha_image"));
    } catch (error) {
        result.error = 'captchaImage'
        return result;
    }
    

    let screenshot = await element.takeScreenshot(true);

    fs.writeFileSync('screenshot.png', screenshot, 'base64');

    let captchaText = (await tesseract.recognize('screenshot.png', 'eng', {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'}))
        .data.text;

    console.log(captchaText);
    
    try {
        
        await sleep(Math.random() * (1000 - 500) + 500);
        let element = await driver.findElement(By.id("captcha"));
        await actions.move({ origin: element }).perform();
        await element.sendKeys(captchaText);
    } catch (error) {
        result.error = 'captchaInput'
        return result;
    }
    

    try {
        warning = await driver.findElement(By.css('span.label.label-danger')).getText();
    } catch (error) {
        warningIndex = true;
        result.error = 'captchaError'
        result.backup = true;
        return result;
    }
    
    try {
        result.name = await driver.findElement(By.name('param[\'raisonSocialeNP\']')).getAttribute('value');
    } catch (error) {
        result.error = 'companyName'
        result.backup = true;
        return result;
    }

    try {
        result.activity = await driver.findElement(By.name('param[\'activite\']')).getAttribute('value');
    } catch (error) {
        result.error = 'activity'
        return result;
    }

    try {
        result.identifiantFiscale = await driver.findElement(By.name('param[\'ifu\']')).getAttribute('value');
    } catch (error) {
        result.error = 'if'
        return result;
    }

    try {
        result.centreRc = await driver.findElement(By.name('param[\'libelleRc\']')).getAttribute('value');
    } catch (error) {
        result.error = 'centreRc'
        return result;
    }

    try {
        result.numeroRc = await driver.findElement(By.name('param[\'numRc\']')).getAttribute('value');
    } catch (error) {
        result.error = 'numeroRc'
        return result;
    }

    try {
        result.adresse = await driver.findElement(By.name('param[\'adresseVille\']')).getAttribute('value');
    } catch (error) {
        result.error = 'Adresse'
        return result;
    }

    try {
        result.regimeImposition = await driver.findElement(By.name('param[\'regimeImpot\']')).getAttribute('value');
    } catch (error) {
        result.error = 'regimeImpot'
        return result;
    }
    
    
    
    
    
    
    
    if (warningIndex!==true) {
        console.log('warning : ',warning);
    }
    console.log(result);
    
    

    // await driver.findElement(By.id('btnSearch')).click();

  } finally {
    // setInterval(()=>{
        driver.quit();
    // },300000)
  }

  if(warning && !warning.includes('captcha'))
    return false;
  return result;
};


async function ICE_Backup(ICE) {
    console.log("Backup Ice");
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.3",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.3",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.3",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.3",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 OPR/113.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OpenWave/93.4.3888.3",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Safari/537.3",
    ];
   
    const options = new chrome.Options();
        // options.set('excludeSwitches', ['enable-automation']);
        // options.set('useAutomationExtension', false);
        options.addArguments('--disable-blink-features=AutomationControlled');
        options.addArguments(`user-agent=${userAgents[Math.floor(Math.random() * userAgents.length)]}`);
        options.addArguments('--no-sandbox');
        options.addArguments('--headless');
        options.addArguments('--disable-dev-shm-usage');
        // options.addArguments('--disable-gpu');
        // options.addArguments('--disable-extensions'); 
        // options.addArguments('--profile-directory=Default');
        options.addArguments('--incognito');
        // options.addArguments('--disable-plugins-discovery');
        options.addArguments("--start-maximized");
        // options.addArguments('--proxy-server=http://130.0.25.110:34607');
        // options.addArguments('--user-data-dir=C:\\Users\\berra\\AppData\\Local\\Google\\Chrome\\User Data\\Default');

        //2nd options
        // options.addArguments('--disable-blink-features=AutomationControlled');
        // options.addArguments('--no-sandbox');
        // options.addArguments('--headless');
        // options.addArguments('--disable-dev-shm-usage');
        // options.addArguments('--disable-gpu');
        // options.addArguments('--disable-extensions'); 


    const driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
    const actions = driver.actions({async: true});
    let result = {};
    let warning;
    let warningIndex;
  try {

    try {
        await driver.get('https://www.proxysite.com/');
        // await driver.executeScript('window.scrollBy(0, 200);');
    } catch (error) {
        result.Backuperror = 'can\'t access website proxy'
        return result;
    }
    
    await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    
    try {
        await sleep(Math.random() * (1000 - 500) + 500);
        let element = await driver.findElement(By.name("d"));
        await actions.move({ origin: element }).perform();
        await element.click();
        await element.sendKeys('https://r-entreprise.tax.gov.ma/rechercheentreprise/result')
    } catch (error) {
        result.Backuperror = 'can\'t access website tax'
        return result;
    }

    try {
        await sleep(Math.random() * (1000 - 500) + 500);
        let element = await driver.findElement(By.css("button[type='submit']"));
        await actions.move({ origin: element }).perform();
        await element.click();
    } catch (error) {
        result.Backuperror = 'go'
        return result;
    }

    await sleep(4000);
    try {
        await sleep(Math.random() * (1000 - 500) + 500);
        await driver.findElement(By.id("iceRadio")).click();
    } catch (error) {
        result.Backuperror = 'iceRadio'
        return result;
    }

    try {
        await sleep(Math.random() * (1000 - 500) + 500);
        await driver.findElement(By.id("mCriteria")).sendKeys(ICE);
    } catch (error) {
        result.Backuperror = 'mCriteria'
        return result;
    }

    let element;
    try {
        element = await driver.findElement(By.id("captcha_image"));
    } catch (error) {
        result.Backuperror = 'captchaImage'
        return result;
    }
    

    let screenshot = await element.takeScreenshot(true);

    fs.writeFileSync('screenshot.png', screenshot, 'base64');

    let captchaText = (await tesseract.recognize('screenshot.png', 'eng', {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'}))
        .data.text;

    console.log(captchaText);
    
    try {
        
        await sleep(Math.random() * (1000 - 500) + 500);
        await driver.findElement(By.id("captcha")).sendKeys(captchaText);
    } catch (error) {
        result.Backuperror = 'captchaInput'
        return result;
    }
    

    try {
        warning = await driver.findElement(By.css('span.label.label-danger')).getText();
    } catch (error) {
        warningIndex = true;
        console.log('not found');
        result.Backuperror = 'captchaError'
        return result;
    }
    
    try {
        result.name = await driver.findElement(By.name('param[\'raisonSocialeNP\']')).getAttribute('value');
    } catch (error) {
        result.Backuperror = 'companyName'
        return result;
    }

    try {
        result.activity = await driver.findElement(By.name('param[\'activite\']')).getAttribute('value');
    } catch (error) {
        result.Backuperror = 'activity'
        return result;
    }

    try {
        result.identifiantFiscale = await driver.findElement(By.name('param[\'ifu\']')).getAttribute('value');
    } catch (error) {
        result.Backuperror = 'if'
        return result;
    }

    try {
        result.centreRc = await driver.findElement(By.name('param[\'libelleRc\']')).getAttribute('value');
    } catch (error) {
        result.Backuperror = 'centreRc'
        return result;
    }

    try {
        result.numeroRc = await driver.findElement(By.name('param[\'numRc\']')).getAttribute('value');
    } catch (error) {
        result.Backuperror = 'numeroRc'
        return result;
    }

    try {
        result.adresse = await driver.findElement(By.name('param[\'adresseVille\']')).getAttribute('value');
    } catch (error) {
        result.Backuperror = 'Adresse'
        return result;
    }

    try {
        result.regimeImposition = await driver.findElement(By.name('param[\'regimeImpot\']')).getAttribute('value');
    } catch (error) {
        result.Backuperror = 'regimeImpot'
        return result;
    }
    
    
    
    
    
    
    
    if (warningIndex!==true) {
        console.log('warning : ',warning);
    }
    console.log(result);
    
    

    // await driver.findElement(By.id('btnSearch')).click();

  } finally {
    // setInterval(()=>{
        driver.quit();
    // },300000)
  }

  if(warning && !warning.includes('captcha'))
    result.backup = false;
  return result;
};

// async function IF_case(IF) {
//     const options = new chrome.Options();
//         options.addArguments('--disable-blink-features=AutomationControlled');
//         options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36');
//         options.addArguments('--disable-extensions');
//         options.addArguments('--headless');
//         options.addArguments('--profile-directory=Default');
//         options.addArguments('--incognito');
//         options.addArguments('--disable-plugins-discovery');
//         options.addArguments("--start-maximized")

//     const driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
//     let result = {};
//     let warning;
//     let warningIndex;
//   try {
//     await driver.get('https://r-entreprise.tax.gov.ma/rechercheentreprise/result');
//     await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    
//     await driver.findElement(By.id("ifRadio")).click();

//     await driver.findElement(By.id("mCriteria")).sendKeys(IF);

//     let element = await driver.findElement(By.id("captcha_image"));

//     let screenshot = await element.takeScreenshot(true);

//     fs.writeFileSync('screenshot.png', screenshot, 'base64');

//     let captchaText = (await tesseract.recognize('screenshot.png', 'eng', {
//         tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'}))
//         .data.text;

//     console.log(captchaText);
    

//     await driver.findElement(By.id('captcha')).sendKeys(captchaText);
//     try {
//         warning = await driver.findElement(By.css('span.label.label-danger')).getText();
//     } catch (error) {
//         warningIndex = true;
//     }

//     const nameElement = await driver.wait(until.elementLocated(By.name('param[\'raisonSocialeNP\']')), 20000);
//         await driver.wait(until.elementIsVisible(nameElement), 20000);
    
//     result.name = await nameElement.getAttribute('value');
//     result.activity = await driver.findElement(By.name('param[\'activite\']')).getAttribute('value');
//     result.identifiantFiscale = await driver.findElement(By.name('param[\'ifu\']')).getAttribute('value');
//     result.centreRc = await driver.findElement(By.name('param[\'libelleRc\']')).getAttribute('value');
//     result.numeroRc = await driver.findElement(By.name('param[\'numRc\']')).getAttribute('value');
//     result.adresse = await driver.findElement(By.name('param[\'adresseVille\']')).getAttribute('value');
//     result.regimeImposition = await driver.findElement(By.name('param[\'regimeImpot\']')).getAttribute('value');
    
//     if (warningIndex!==true) {
//         console.log('warning : ',warning);
//     }
    
    
//     console.log(result);
    
    

//     // await driver.findElement(By.id('btnSearch')).click();

//   } finally {
//     // setInterval(()=>{
//         driver.quit();
//     // },300000)
//   }
//   if(warning && !warning.includes('captcha'))
//     return false;
//   return result;
// };


module.exports = {getICE,putICE}