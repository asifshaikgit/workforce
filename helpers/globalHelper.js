const fs = require('fs');
const path = require('path');
const config = require('../config/app');
const moment = require('moment');
const uuidValidate = require('uuid-validate'); // Use uuid-validate package for validation
const { table } = require('console');
const { getConnection } = require('../src/middlewares/connectionManager');

/**
 * Sanitize the object i.e. strip out the HTML tags
 * 
 * @param object obj
 * @paran array excludedKeys : array of fields to be ignored
 * @return object
 */
const cleanUpObject = async (obj, excludedKeys = []) => {
  delete obj.tenant_id;
  for (let prop in obj) {
    if (excludedKeys.includes(prop)) {   // excluding exception keys
      continue;
    }
    else if (obj[prop] === null || obj[prop] === '') {
    }
    else if (typeof obj[prop] === 'string') {
      obj[prop] = obj[prop].replace(/<[^>]*>/g, '');   // remove html tags
    }
    else {
      obj[prop] = obj[prop];
    }
  }
  return obj;
};

/**
 * Generate an OTP
 * 
 * @param int length : length of the OTP
 * @return int
 */
const generateOTP = async (length = 6) => {
  let result = '';
  let characters = '0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
};

// Function to check if a string is a valid UUID
const isValidUUID = async (str) => {
  if (uuidValidate(str)) {
    return true;
  }
  return false;
}

/**
 * Generate a password
 * 
 * @param int $minLength : min length of the password
 * @param int $maxLength : max length of the password
 * @return string
 */
const randomPasswordGenerator = async () => {
  let numberChars = '0123456789';
  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let specialChars = '#?!@$%^&*-';
  let allChars = specialChars + numberChars + upperChars + lowerChars;
  let randPasswordArray = Array(10);
  randPasswordArray[0] = numberChars;
  randPasswordArray[1] = upperChars;
  randPasswordArray[2] = lowerChars;
  randPasswordArray[3] = specialChars;
  randPasswordArray = randPasswordArray.fill(allChars, 4);
  let password = await shuffleArray(randPasswordArray.map(function (x) { return x[Math.floor(Math.random() * x.length)]; })).join('');
  return password;
};

/**
 * Generate a password
 * 
 * @param int $minLength : min length of the password
 * @param int $maxLength : max length of the password
 * @return string
 */
const randomDatabasePasswordGenerator = async () => {
  let numberChars = '0123456789';
  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let allChars = numberChars + upperChars + lowerChars;
  let randPasswordArray = Array(10);
  randPasswordArray[0] = numberChars;
  randPasswordArray[1] = upperChars;
  randPasswordArray[2] = lowerChars;
  randPasswordArray = randPasswordArray.fill(allChars, 4);
  let password = await shuffleArray(randPasswordArray.map(function (x) { return x[Math.floor(Math.random() * x.length)]; })).join('');
  return password;
};

/**
 * Shuffle the generated password.
 * 
 * @param password $array 
 * @return string
 */
function shuffleArray(password) {
  for (let i = password.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = password[i];
    password[i] = password[j];
    password[j] = temp;
  }
  return password;
}

/**
 * Extracting the sub domain from the email id.
 * @param {string} email 
 * @returns json
 */
const domainName = async (email) => {
  let domain = null;
  const pos = email.search('@'); // get position of domain
  if (pos > 0) {
    domain = email.slice(pos + 1); // use the slice method to get domain name, "+1" mean domain does not include "@"
  } else {
    return { status: false };
  }
  if (domain.includes('.in')) {
    domain = domain.replace('.in', '');
  } else if (domain.includes('.com')) {
    domain = domain.replace('.com', '');
  } else if (domain.includes('.co')) {
    domain = domain.replace('.co', '');
  } else if (domain.includes('.org')) {
    domain = domain.replace('.org', '');
  } else if (domain.includes('.net')) {
    domain = domain.replace('.net', '');
  }
  return { status: true, data: domain };
};

// Function to fetch & move the updaloded document from a temp location to permanent location
const fetchAndMoveDocument = async (documentData, pathDest, fileName) => {
  let _pathSource = config.documentUploadPath + '/temp';
  let _pathDest = config.documentUploadPath + '/' + pathDest;
  if (!fs.existsSync(_pathDest)) {
    // Create the destination directory
    fs.mkdirSync(_pathDest, { recursive: true });
  }
  let format = path.extname(documentData[0]?.document_path);
  let file = String(documentData[0].id + format);
  var fileName = String(fileName + format);
  try {
    // Read the file
    const data = fs.readFileSync(path.join(_pathSource, file));
    // Write the file to the destination directory
    fs.writeFileSync(path.join(_pathDest, fileName), data);
  } catch (error) {
    throw error;
  }
  return fileName;
};

// Function to fetch & move the updaloded document from a temp location to permanent location
const fetchAndMoveDocumentInviteEmployee = async (subdomain_name, documentData, pathDest, fileName) => {
  let _pathSource = config.documentUploadPath + `/${subdomain_name}/Employee/Invite-Employee-Document`;
  let _pathDest = config.documentUploadPath + '/' + pathDest;
  if (!fs.existsSync(_pathDest)) {
    // Create the destination directory
    fs.mkdirSync(_pathDest, { recursive: true });
  }
  let format = path.extname(documentData[0].document_path);
  var fileName = String(fileName + format);
  try {
    // Read the file
    const data = fs.readFileSync(path.join(_pathSource, documentData[0].document_name));
    // Write the file to the destination directory
    fs.writeFileSync(path.join(_pathDest, fileName), data);
  } catch (error) {
    throw error;
  }
  return fileName;
};

/**
 * 
 * @param {*} docData 
 * @param {*} pathDest 
 * @returns 
 */
const destroyDocument = async (docData, pathDest) => {
  if (docData.status) {
    for (const key in docData.data) {
      if (docData.data[key].document_url) {
        DOCUMENT_URL = docData.data[key].document_url.split('/');
        DOCUMENT_NAME = DOCUMENT_URL[DOCUMENT_URL.length - 1];
        let _pathDest = config.documentUploadPath + '/' + pathDest + '/' + DOCUMENT_NAME;
        fs.unlink(_pathDest, (error) => {
          console.log(error);
          return;
        });
      }
    }
  }
  return;
};

// Function to get the email templates
const getMail = async (condition) => {
  try {
    const templateData = await dbConnection('mail_templates')
      .select()
      .where(condition)
      .first();
    return templateData;
  } catch (error) {
    console.error(error);
    return error;
  }
};

/**
 * Calculate exact one month from the given date.
 *
 * @param {date} date
 * @return Json
 * 
 */
const getOneMonthEndDate = async (date) => {
  // New Second cycle end date
  let temp2 = moment(date);
  const inputDate = new Date(temp2);

  // Add 1 month
  const year = inputDate.getFullYear();
  const month = inputDate.getMonth() + 1;
  const day = inputDate.getDate();

  let newDate;
  let newMonth;
  let newYear;
  let leapYear = (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);

  if (!leapYear) {
    if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
      if (month == 1) {
        if (day == 1) {
          newDate = 31;
          newMonth = month;
          newYear = year;
        } else if (day <= 28) {
          newDate = day - 1;
          newMonth = month + 1;
          newYear = year;
        } else if (day == 30 || day == 29) {
          newDate = 27;
          newMonth = month + 1;
          newYear = year;
        } else {
          newDate = 28;
          newMonth = month + 1;
          newYear = year;
        }
      } else {
        if (day == 1) {
          newDate = 31;
          newMonth = month;
          newYear = year;
        } else if (day <= 30) {
          newDate = day - 1;
          newMonth = month + 1;
          newYear = year;
          if (month == 12) {
            newMonth = 1;
            newYear = year + 1;
          }
        } else {
          if (month + 1 == 8) {
            newDate = 30;
          } else {
            newDate = 29;
          }

          if (month == 12) {
            newMonth = 1;
            newYear = year + 1;
            newDate = 30;
          } else {
            newMonth = month + 1;
            newYear = year;
          }

        }
      }
    } else {
      if (month == 2) {
        if (day == 1) {
          newDate = 28;
          newMonth = month;
          newYear = year;
        } else if (day < 28) {
          newDate = day - 1;
          newMonth = month + 1;
          newYear = year;
        } else {
          newDate = 30;
          newMonth = month + 1;
          newYear = year;
        }
      } else {
        if (day == 1) {
          newDate = 30;
          newMonth = month;
          newYear = year;
        } else if (day < 30) {
          newMonth = month + 1;
          newYear = year;
          newDate = day - 1;
        } else {
          newDate = 30;
          newMonth = month + 1;
          newYear = year;
        }
      }
    }
  } else {
    if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
      if (month == 1) {
        if (day == 1) {
          newDate = 31;
          newMonth = month;
          newYear = year;
        } else if (day <= 29) {
          newDate = day - 1;
          newMonth = month + 1;
          newYear = year;
        } else if (day == 30) {
          newDate = 28;
          newMonth = month + 1;
          newYear = year;
        } else {
          newDate = 29;
          newMonth = month + 1;
          newYear = year;
        }
      } else {
        if (day == 1) {
          newDate = 31;
          newMonth = month;
          newYear = year;
        } else if (day <= 30) {
          newDate = day - 1;
          newMonth = month + 1;
          newYear = year;
          if (month == 12) {
            newMonth = 1;
            newYear = year + 1;
          }
        } else {
          if (month + 1 == 8) {
            newDate = 30;
          } else {
            newDate = 29;
          }

          if (month == 12) {
            newMonth = 1;
            newYear = year + 1;
            newDate = 30;
          } else {
            newMonth = month + 1;
            newYear = year;
          }

        }
      }
    } else {
      if (month == 2) {
        if (day == 1) {
          newDate = 29;
          newMonth = month;
          newYear = year;
        } else if (day < 29) {
          newDate = day - 1;
          newMonth = month + 1;
          newYear = year;
        } else {
          newDate = 31;
          newMonth = month + 1;
          newYear = year;
        }
      } else {
        if (day == 1) {
          newDate = 30;
          newMonth = month;
          newYear = year;
        } else if (day < 30) {
          newMonth = month + 1;
          newYear = year;
          newDate = day - 1;
        } else {
          newDate = 30;
          newMonth = month + 1;
          newYear = year;
        }
      }
    }
  }
  const modifiedDate = moment([newYear, (newMonth - 1), newDate]).format('YYYY-MM-DD');
  return modifiedDate;
};

// Function to remove duplicate objects based on the "id" key
function removeDuplicatesById(arr) {
  const map = new Map();
  return arr.reduce((uniqueArr, obj) => {
    if (!map.has(obj.id)) {
      map.set(obj.id, true);
      uniqueArr.push(obj);
    }
    return uniqueArr;
  }, []);
}

// Convert camel Case to Title Case
function toTitleCase(str) {
  const newStr = str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return newStr;
}

/**
 * Removes keys from an object that have values of empty strings ('') or are undefined.
 * @param {Object} obj - The input object from which keys will be removed.
 * @returns {Object} - A new object with empty string and undefined keys removed.
 */
function removeEmptyAndUndefinedKeys(obj) {
  // Use Object.entries() to get an array of key-value pairs.
  // Filter the entries to remove keys with values that are empty strings ('') or undefined.
  const filteredEntries = Object.entries(obj).filter(([_, value]) => value !== '' && value !== undefined);

  // Use Object.fromEntries() to convert the filtered array back into an object.
  return Object.fromEntries(filteredEntries);
}

// Calculate total hours from array of hours
function calculateHours(intervals) {
  // Calculate total sum of intervals in seconds
  const totalSeconds = intervals.reduce((total, interval) => {
    return total + timeToSeconds(interval);
  }, 0);

  // Convert total sum of seconds back to HH:MM:SS format
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return totalTime;
}

// Function to convert time format HH:MM:SS to seconds
function timeToSeconds(time) {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Function to generate the employee avatar using gender of employee
 * 
 * @param {*} employee 
 * @returns 
 */
function generateEmployeeAvatar(employee) {

  if (employee.gender) {
    let unqNumber = (employee.gender.toLowerCase() == 'male') ? 36 : 35;
    let randomNumber = Math.floor(Math.random() * (unqNumber - 1 + 1)) + 1;
    return `${config.avatarLink}${employee.gender.toLowerCase()}/${randomNumber}.png`;
  } else {
    return null;
  }
}

/**
 * Function to generate unique referece_id for a specific table.
 * 
 * Logic:
 * -  Establish DB connection.
 * -  Get count of records in table.
 * -  Get prefixes related to the table.
 * -  Generate refernce_id with combination as prefix_name + separator + (count + prefix_number)
 * -  Check whether if any refernce_id already exist is the respective table.
 *    ~ If exist increment by 1 to the count of records in table, continue to generate reference id till we get new reference id that not exist in respective table.
 *    ~ If generated refernce_id not exist in respective table return reference id.
 * 
 * @param {*} String
 * @returns {String}
 */
const generateUniqueReferenceId = async (tableName, prefixSlug, condition = {}) => {

  /* Establishing db connection with collection */
  let dbConnection = await getConnection();

  // Get count of records in the table
  let count = await dbConnection(tableName).count().where(condition);
  count = (count.length > 0) ? count[0]?.count : 0;

  let generateRefernceNumber = true;
  let reference_id;

  while (generateRefernceNumber) {
    // Get Prefix data from `prefixes` using prefixSlug.
    let prefix = await dbConnection('prefixes').select('name', 'prefix_name', 'separator', 'number').where({ 'slug': prefixSlug });
    reference_id = prefix[0]?.prefix_name + prefix[0]?.separator + (Number(count) + prefix[0]?.number);

    /* Checking the reference id already exists, if exists iterate the loop else stop the iteration */
    let referenceIdExistance = await dbConnection(tableName).select('id').where({ 'reference_id': reference_id });
    if (referenceIdExistance.length == 0) {
      generateRefernceNumber = false;
    } else {
      count++;
    }
  }

  return reference_id;
}

// Define a function to decode HTML entities
function decodeHtmlEntities(encodedString) {
  const entityMap = {
    "&#x2F;": "/",
    // Add more HTML entities as needed
  };

  return encodedString.replace(/&#(\d+);|&#x([0-9a-fA-F]+);/g, function (match, dec, hex) {
    if (dec) {
      return String.fromCharCode(dec);
    } else if (hex) {
      return String.fromCharCode(parseInt(hex, 16));
    } else {
      return entityMap[match] || match;
    }
  });
}

// Function to replace null values with ''
function replaceNullsWithEmptyString(array = []) {
  if (array.length > 0) {
    array.forEach(async obj => {
      for (let key in obj) {
        if (obj[key] === null) {
          obj[key] = '';
        }
      }
    });
  }
  return array;
}

module.exports = { decodeHtmlEntities, cleanUpObject, generateOTP, randomPasswordGenerator, domainName, fetchAndMoveDocument, fetchAndMoveDocumentInviteEmployee, destroyDocument, getMail, randomDatabasePasswordGenerator, getOneMonthEndDate, removeDuplicatesById, isValidUUID, toTitleCase, removeEmptyAndUndefinedKeys, calculateHours, generateEmployeeAvatar, generateUniqueReferenceId, replaceNullsWithEmptyString };
