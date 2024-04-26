// const { Route53Client, ChangeResourceRecordSetsCommand } = require("@aws-sdk/client-route-53");
// const awsConfig = require('../../config/aws');
// const { responseCodes } = require('../../constants/responseCodes');
// const { responseMessage } = require('../../constants/responseMessage');
// const SubDomainCreationError = require("../../error/SubDomainCreationError");
// const { tryCatch } = require("../../utils/tryCatch");

// /**
//  * Funtion to create a new sub domain.
//  *
//  * @param data object.
//  * @return Json
//  */
// const registerClient =
//     async (data) => {
//         var params = {
//             ChangeBatch: {
//                 Changes: [
//                     {
//                         Action: data.actionType,
//                         ResourceRecordSet: {
//                             AliasTarget: {
//                                 DNSName: awsConfig.aws.dnsName,
//                                 EvaluateTargetHealth: true,
//                                 HostedZoneId: awsConfig.aws.dnszoneId
//                             },
//                             Name: data.subDomain + '.' + awsConfig.aws.domain,
//                             Type: 'A',
//                         }
//                     }
//                 ],
//                 Comment: "Creation of a new AWS SUBDOMAIN account"
//             },
//             HostedZoneId: awsConfig.aws.zoneId// Depends on the type of resource that you want to route traffic to
//         };
//         const client = await new Route53Client({
//             region: awsConfig.aws.region,
//             credentials: {
//                 accessKeyId: awsConfig.aws.accessKey,
//                 secretAccessKey: awsConfig.aws.secretKey
//             },
//         });
//         return new Promise((resolve, reject) => {
//             const command = new ChangeResourceRecordSetsCommand(params);
//             client.send(command, (err, data) => {
//                 if (err) {
//                     reject(err);
//                 } else {
//                     resolve(data);
//                 }
//             });
//         });
//     };

// module.exports = {
//     registerClient
// }
