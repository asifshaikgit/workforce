exports.regexPatterns = {

    // validate the uuid pattern of example: 313b0f60-080a-4bae-b53c-fac1901b5654
    uuidRegex: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,

    // mobile number patter 123-455-4321
    contactNumberRegex: /^(\d{3}-\d{3}-\d{4}|\d{5}[- ]?\d{5})$/,

    // Matches phone numbers in various formats: (123) 456-7890, 123-456-7890, 123 456 7890, etc.
    phoneRegex: /^(?:\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}|\d{5}[- ]?\d{5})$/,

    // Matches zipcode/ pincode with all numerics and doesn't allow all 0s or 1s and may have 5-7 digits
    zipcode: /^(?!0+$|1+$)\d{5,7}$/,

    // Validates email addresses 
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // Validates email addresses 
    emailRegex2: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

    // /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

    // Matches strings consisting only of digits, hyphens, and parentheses.
    digitsHyphensParenthesesOnly: /^[0-9-()]*$/,

    // Matches strings containing only uppercase and lowercase letters, along with spaces.
    alphaCharactersAndSpacesOnly: /^[a-zA-Z ]*$/,

    // Matches strings containing only uppercase and lowercase letters, along with spaces.
    alphaCharactersAndSpacesThirtyThreeOnly: /^[a-zA-Z ]{0,33}$/,

    // Matches strings containing only uppercase and lowercase letters, along with spaces.
    alphaNumericCharactersAndSpacesFiftyOnly: /^[a-zA-Z0-9 ]{0,50}$/,

    // Validates strings containing only letters (A-Z, case insensitive), plus signs (+), and hyphens (-) 
    bloodGroupRegex: /^[a-zA-Z+-]*$/,

    // Matches strings containing only numeric digits (0-9) and spaces.
    numbersSpaceRegex: /^[0-9 ]*$/,

    // Validates strings containing only numeric digits (0-9), allowing zero or more occurrences of digits.
    numericOnlyRegex: /^[0-9]*$/,

    // Matches specific special characters: { } ? ! " ~ $ % * > <
    specialCharactersRegex: /[{}?!"~$%*><|]/,

    // Validates a Social Security Number (SSN) format in the pattern: XXX-XX-XXXX, disallowing specific invalid combinations like 666 or 000 as the first three digits, 00 as the next two digits, and 0000 as the last four digits.
    ssnRegex: /^(?!666|000|9\d{2})\d{3}-(?!00)\d{2}-(?!0{4})\d{4}$/,

    // Validates strings containing only alphanumeric characters (letters and numbers) and spaces.
    alphanumericSpaceRegex: /^[a-zA-Z0-9 ]*$/,

    // Validates date strings in the format YYYY-MM-DD, allowing for year (four digits), month (01-12), and day (01-31) with consideration for different month lengths and leap years.
    dateRegex: /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/,

    // Validates time in 24-hour format (hh:mm) where hours are from 00 to 23 and minutes are from 00 to 59. Example matches: 00:00, 12:45, 23:59, etc.
    time24HoursRegex: /^([0-9]?[0-9]):[0-5][0-9]$/, // 00:00 to 99:59

    // Validates time in the 24-hour format (hh:mm), allowing hours from 00 to 23 and minutes from 00 to 59.
    twentyFourHourTimeRegex: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, // 00:00 to 23:59

    // Validates decimal numbers in various formats: integer or floating-point numbers with up to two decimal places. Examples: 10, 3.14, 0.01, etc.
    decimalNumberWithTwoDecimalsRegex: /^\d+(\.\d{1,2})?$/,

    // Validates decimal numbers in various formats: integer or floating-point numbers, allowing optional decimals. Examples: 10, 3.14, 0.001, etc.
    decimalNumberRegex: /^\d+(\.\d+)?$/,

    // Validates phone numbers with an optional plus sign at the beginning, allowing one or more digits after the plus sign.
    phoneNumberWithCountryCodeRegex: /^(\+\d{1,4})?\d*$/,

    // Validates US phone numbers in the format xxx-xxx-xxxx.
    usPhoneNumberRegex: /^(\d{3}-){2}\d{4}$/,

    // Validates strings with exactly 12 characters, allowing only digits (0-9) or hyphens (-). eg: 123456789012 , 12-34-56-78-90 , 000-(111)-(222)
    numberOrHyphenRegex: /^[0-9-(]{12}$/,

    // Validates the hours and minutes for mat like HH:MM
    hoursValidationRegex: /^(\d{1,3}|(0[0-9]|1[0-9]|2[0-3])):[0-5][0-9]$/,

    //Validates the URL or any link
    urlValidationRegex: /\b(?:https?:\/\/)?(?:www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/,

    documentPatterns: {

        // i94 Regex Pattern: 9 digits, followed by a letter in the 10th position, and a digit in the 11th position.
        i94DocumentNumber: /^(?:\d{11}|\d{9}[A-Za-z]\d)$/
    }
}