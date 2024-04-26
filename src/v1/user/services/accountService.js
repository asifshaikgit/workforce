const bcrypt = require('bcryptjs');
const indexRepository = require('../repositories/index');
const { tokenGeneration, refreshTokenGeneration } = require('../../../../helpers/jwttokengeneration');
const { generateOTP } = require('../../../../helpers/globalHelper');
const { randomPasswordGenerator } = require('../../../../helpers/globalHelper');
const { sendMail } = require('../../../../utils/emailSend');
const { responseMessages } = require('../../../../constants/responseMessage');
const InvalidRequestException = require('../../../../error/InvalidRequestError');
const tenantService = require('../../tenant/services/tenantService');
const { getEmailTemplate, getTemplate } = require('../../../../helpers/emailTemplate');
const geoip = require('geoip-lite');

/**
 * User login check function
 *
 * @param body object.
 * @return Json
 *
 * Find the data by email id, compare the request password to collection stored password using hashing the requested password.
 * If password is correct generate the token.
 */
const login = async (req) => {
  // Fetching Request Login IP
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const geo = geoip.lookup(clientIp);

  // Condition
  const condition = { email_id: req.body.email_id.toLowerCase() };

  // Fetch tenant info condition
  const tenant = { subdomain_name: req.body.subdomain_name };

  // Fields to fetch
  const fields = ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'password', 'is_logged_in', 'ssn', 'enable_login', 'status', 'otp', 'failed_login_attempts', 'is_tenant_owner', 'gender', 'login_expire_at', 'balance_amount', 'standard_pay_amount', 'reference_id', 'role_id', 'is_super_admin', 'team_id', 'hours_worked', 'employment_type_id', 'profile_picture_url', 'temp_password', 'e_verified', 'payroll_config_settings_id', 'is_us_citizen'];
  const loginData = await indexRepository.find('employee', fields, condition);
  const employeeData = loginData.data[0];

  if (employeeData.enable_login) {
    currentTimestamp = new Date().getTime();
    expireTime = new Date(employeeData.login_expire_at).getTime();
    isExpired = employeeData.login_expire_at === null ? true : expireTime < currentTimestamp;
    if (isExpired) {
      const password = employeeData.password;
      const passwordValidation = await bcrypt.compare(req.body.password, password);
      if (passwordValidation) {
        const org = await indexRepository.find('organization', ['*']);
        /* Get tenant details to generate the token */
        const subdomain_name_details = await tenantService.find(tenant);
        const tenant_id = subdomain_name_details.data[0].id;
        const subdomain_name = subdomain_name_details.data[0].subdomain_name;
        /* Get tenant details to generate the token */

        /* Get the JWT */
        const failedCount = 0;
        const token = tokenGeneration(employeeData, tenant_id, subdomain_name);
        const refreshToken = refreshTokenGeneration(employeeData, tenant_id, subdomain_name);
        /* Get the JWT */

        /* Update employee access token details */
        const update = {
          failed_login_attempts: failedCount,
          access_token: token,
          refresh_token: refreshToken,
          last_login_time: new Date(),
          is_logged_in: true,
          updated_at: new Date(),
        };
        indexRepository.update('employee', condition, update);
        /* Update employee access token details */

        /* Update employee activity log */
        const newLogActivity = {
          employee_id: employeeData.id,
          ip: clientIp,
          login_time: new Date(),
          region: geo ? geo.timezone : null,
          city: geo ? geo.city : null,
          country: geo ? geo.country : null,
          latitude: geo ? geo.ll[0] : null,
          longitude: geo ? geo.ll[1] : null,
        };
        indexRepository.logActivityStore(newLogActivity);
        /* Update employee activity log */

        /* Prepare the return response object */
        const response = {
          status: true,
          data: {
            login_id: employeeData.id,
            logo_url: org.status ? org.data[0].logo_url : '',
            profile_picture_url: employeeData.profile_picture_url ? employeeData.profile_picture_url : '',
            full_name: employeeData.display_name,
            first_name: employeeData.first_name,
            last_name: employeeData.last_name,
            email_iD: employeeData.email_id,
            gender: employeeData.gender,
            access_token: token,
            refresh_token: refreshToken,
            reference_id: employeeData.reference_id,
            role_id: employeeData.role_id,
            super_admin: employeeData.is_super_admin ? employeeData.is_super_admin : false,
            subdomain_name,
            change_password: employeeData.temp_password === true,
            tenant_id,
            currency_symbol: org.status ? org.data[0].currency_symbol : '$',
            date_format: org.status ? org.data[0].date_format : 'MM/DD/YYYY',
          },
        };
        /* Prepare the return response object */
        return response;
      } else {
        /* Return the response if password does not match */
        const failedCount = employeeData.failed_login_attempts + 1;
        const update = { failed_login_attempts: failedCount };
        await indexRepository.update('employee', condition, update);
        throw new InvalidRequestException('Invalid Password. Please enter a valid password');
        /* Return the response if password does not match */
      }
    } else {
      throw new InvalidRequestException(responseMessages.login.invalidAccess);
    }
  } else {
    throw new InvalidRequestException(responseMessages.login.accountInActive);
  }
};

/**
 * Replace All occurrences
 * @param {*} str
 * @param {*} obj
 * @returns
 */
function allReplace(str, obj) {
  for (const x in obj) {
    const regex = new RegExp(`${x}`, 'g');
    str = str.replace(regex, obj[x]);
  }
  return str;
}

/**
 * User login check function
 *
 * @param dbConnection Object. (Tenant Databse Connection Details)
 * @param body object.
 * @return Json
 *
 * Find the email id, update the newly generated otp in collection and send the otp to the respective mail id.
 */
const forgotPassword = async (body) => {
  const condition = { email_id: body.email_id };
  const fields = ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'email_id'];
  const userResponse = await indexRepository.find('employee', fields, condition);

  if (userResponse.status) {
    const userInfo = userResponse.data[0];
    const newOTP = await generateOTP();
    const condition = { id: userInfo.id };
    const update = { otp: newOTP, updated_by: body.updated_by_id };
    const updatedResponse = await indexRepository.update('employee', condition, update);
    const signature = await indexRepository.find('organization', ['email_signature']);
    if (updatedResponse.status) {
      const slug = 'otp';
      const replaceObj = {
        '{{first_name}}': userInfo.first_name,
        '{{last_name}}': userInfo.last_name,
        '{{middle_name}}': userInfo.middle_name,
        '{{email_id}}': userInfo.email_id,
        '{{display_name}}': userInfo.display_name,
        '{{otp}}': newOTP,
        '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
      };

      const templateData = await getEmailTemplate(replaceObj, slug);
      const emailData = {
        toEmail: userInfo.email_id,
        subject: templateData.subject,
        html: templateData.template,
      };
      try {
        sendMail(emailData);
        console.log(`Email Sent Successfully to ${userInfo.email_id}`);
      } catch (err) {
        console.log(err);
      }
      return { status: true, message: responseMessages.common.success };
    } else {
      throw new InvalidRequestException(responseMessages.common.somethindWentWrong);
    }
  } else {
    throw new InvalidRequestException(responseMessages.login.accountNotFound);
  }
};

/**
 * User login check function
 *
 * @param dbConnection object. (Tenant Databse Connection Details)
 * @param body object.
 * @return Json
 *
 * Find the data by using email id and generate the random password, hash the password update in the collection, send the generated password to user through registed email id.
 */
const verifyOtpSendPassword = async (body) => {
  const condition = { email_id: body.email_id };
  const fields = ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'otp'];
  const userResponse = await indexRepository.find('employee', fields, condition);
  const userData = userResponse.data[0];
  if (userData.otp !== Number(body.otp)) {
    throw new InvalidRequestException(responseMessages.login.otpError);
  }
  const newPassword = await randomPasswordGenerator();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  const updateData = { password: hashedPassword, updated_by_id: body.updated_by_id, temp_password: true };
  const updatedResponse = await indexRepository.update('employee', condition, updateData);
  if (updatedResponse.status) {
    const slug = 'forgot-password';
    const signature = await indexRepository.find('organization', ['email_signature']);
    const replaceObj = {
      '{{display_name}}': userData.display_name,
      '{{first_name}}': userData.first_name,
      '{{last_name}}': userData.last_name,
      '{{email_id}}': userData.email_id,
      '{{password}}': newPassword,
      '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
    };

    const templateData = await getEmailTemplate(replaceObj, slug);
    const emailData = {
      toEmail: userData.email_id,
      subject: templateData.subject,
      html: templateData.template,
    };
    try {
      sendMail(emailData, body.loginTenantName);
      console.log(`Email Sent Successfully to ${userData.email_id}`);
    } catch (err) {
      console.log(err);
    }
    return { status: true, message: responseMessages.common.success };
  } else {
    throw new InvalidRequestException(responseMessages.login.otpError);
  }
};

/**
 * @param dbConnection object. (Tenant Databse Connection Details)
 * @param condition object.
 * @return Json
 *
 * find the data in the collection.
 */
const logout = async (body) => {
  const condition = { id: body.login_id };
  let updateEmp = false;
  let userLogout;
  const update = {
    // access_token: null,
    // refresh_token: null,
    is_logged_in: false,
    updated_by: body.updated_by,
  };
  const findCondition = { id: body.login_id, is_logged_in: true };
  const userData = await indexRepository.find('employee', ['id'], findCondition);
  if (userData.status) {
    userLogout = await indexRepository.update('employee', condition, update);
    updateEmp = userLogout.status
  } else {
    throw new InvalidRequestException(responseMessages.login.loginOutError);
  }
  if (updateEmp) {
    return { status: true, data: userLogout };
  } else {
    throw new InvalidRequestException(responseMessages.common.somethindWentWrong, user_logout.error);
  }
};

/**
 * @param dbConnection object. (Tenant Databse Connection Details)
 * @param data object.
 * @return Json
 *
 * find the data in the collection.
 */
const changePassword = async (body) => {
  const condition = { id: body.loginUserId };
  const fields = ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'otp', 'password'];
  const userResponse = await indexRepository.find('employee', fields, condition);
  if (userResponse.status) {
    const userData = userResponse.data[0];
    const password = userData.password;
    const passwordValidation = await bcrypt.compare(body.old_password, password);
    if (passwordValidation) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(body.password, salt);
      const update = { password: hashedPassword, updated_by: body.updated_by, temp_password: false };
      const updatedResponse = await indexRepository.update('employee', condition, update);
      if (updatedResponse.status) {
        const slug = 'update-password';
        const signature = await indexRepository.find('organization', ['email_signature', 'organization_name']);
        const replaceObj = {
          '{{display_name}}': userData.display_name,
          '{{first_name}}': userData.display_name,
          '{{last_name}}': userData.display_name,
          '{{email_id}}': userData.email_id,
          '{{password}}': body.password,
          '{{organization_name}}': signature.status ? signature.data[0].organization_name : ' ',
          '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
        };

        const templateData = await getEmailTemplate(replaceObj, slug);
        const emailData = {
          toEmail: userData.email_id,
          subject: templateData.subject,
          html: templateData.template,
        };
        try {
          sendMail(emailData, body.loginTenantName);
          console.log(`Email Sent Successfully to ${userData.email_id}`);
        } catch (err) {
          console.log(err);
        }
        return { status: true, message: updatedResponse.message, error: updatedResponse.error };
      } else {
        throw new InvalidRequestException(responseMessages.common.somethindWentWrong, updatedResponse.error);
      }
    } else {
      throw new InvalidRequestException(responseMessages.login.passwordInvalid);
    }
  } else {
    throw new InvalidRequestException(responseMessages.login.invalidUserId);
  }
};

/**
 * @param dbConnection object. (Tenant Databse Connection Details)
 * @param data object.
 * @return Json
 *
 * find the data in the collection.
 */
const resetPassword = async (body) => {
  const condition = { email_id: body.email_id };
  const fields = ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'otp', 'password'];
  const userResponse = await indexRepository.find('employee', fields, condition);
  if (userResponse.status) {
    const userData = userResponse.data[0];
    
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(body.password, salt);
      const update = { password: hashedPassword, updated_by: body.updated_by, temp_password: false };
      const updatedResponse = await indexRepository.update('employee', condition, update);
      if (updatedResponse.status) {
        const slug = 'update-password';
        const signature = await indexRepository.find('organization', ['email_signature', 'organization_name']);
        const replaceObj = {
          '{{display_name}}': userData.display_name,
          '{{first_name}}': userData.display_name,
          '{{last_name}}': userData.display_name,
          '{{email_id}}': userData.email_id,
          '{{password}}': body.password,
          '{{organization_name}}': signature.status ? signature.data[0].organization_name : ' ',
          '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
        };

        const templateData = await getEmailTemplate(replaceObj, slug);
        const emailData = {
          toEmail: userData.email_id,
          subject: templateData.subject,
          html: templateData.template,
        };
        try {
          sendMail(emailData, body.loginTenantName);
          console.log(`Email Sent Successfully to ${userData.email_id}`);
        } catch (err) {
          console.log(err);
        }
        return { status: true, message: updatedResponse.message, error: updatedResponse.error };
      } else {
        throw new InvalidRequestException(responseMessages.common.somethindWentWrong, updatedResponse.error);
      }
  } else {
    throw new InvalidRequestException(responseMessages.login.invalidUserId);
  }
};

/**
 * @param data object.
 * @return Json
 *
 * find the data in the collection.
 */
const regenerateNewPassword = async (body) => {
  const condition = { id: body.employee_id };
  const fields = ['id', 'first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'otp'];
  const userResponse = await indexRepository.findOne('employee', fields, condition);
  if (userData.status) {
    const userData = userResponse.data[0];
    const newPassword = await randomPasswordGenerator();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const update = { password: hashedPassword, updated_by_id: body.updated_by_id };

    const regeneratePassword = await indexRepository.regenerateNewPassword(condition, update);
    if (regeneratePassword.status) {
      const newPassword = await randomPasswordGenerator();
      const slug = 'reset-password';
      const signature = await indexRepository.find('organization', ['email_signature']);
      const replaceObj = {
        '{{first_name}}': userData.first_name,
        '{{last_name}}': userData.last_name,
        '{{display_name}}': userData.display_name,
        '{{email_id}}': userData.email_id,
        '{{password}}': newPassword,
        '{{organization_signature}}': signature.status ? (signature.data[0].email_signature ? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
      };

      const templateData = await getEmailTemplate(replaceObj, slug);
      const emailData = {
        toEmail: userData.email_id,
        subject: templateData.subject,
        html: templateData.template,
      };
      try {
        sendMail(emailData);
        console.log(`Email Sent Successfully to ${userData.email_id}`);
      } catch (err) {
        console.log(err);
      }

      return { status: true, message: responseMessages.common.success };
    } else {
      throw new InvalidRequestException(responseMessages.login.otpError);
    }
  } else {
    throw new InvalidRequestException(responseMessages.login.otpError);
  }
};

module.exports = { login, forgotPassword, verifyOtpSendPassword, logout, changePassword, resetPassword, regenerateNewPassword };
