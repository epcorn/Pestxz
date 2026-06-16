import Client from "../models/clientModel.js";

export const dailyServiceReport = async (req, res) => {
  try {
    // const id = req.user.client ? req.user.client : null;
    const date = new Date();
    const today = date.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).setUTCHours(0, 0, 0, 0);

    const clients = await Client.find().populate({
      path: "services",
      // match: {
      //   updatedAt: {
      //     $gte: yesterday,
      //     $lt: today,
      //   },
      // },
      populate: {
        path: "location",
      },
    });
    let regulars, complaints;
    for (let service of clients) {
      regulars = service.services.filter((s) => s.type === "Regulars");
      complaints = service.services.filter((s) => s.type === "Complaint");
      // for(i=0;i<regulars.length;i++){

      // }
    }

    // for (let client of clients) {
    //   if (client.services.length > 0) {
    //     const workbook = new exceljs.Workbook();
    //     await workbook.xlsx.readFile("./tmp/dailyReport.xlsx");
    //     let worksheet = workbook.getWorksheet("Sheet1");

    //     for (let i = 0; i < client.services.length; i++) {
    //       let row = worksheet.getRow(i + 4);
    //       const service = client.services[i];
    //       const location = `${service.location.floor}, ${service.location.location}, ${service.location.subLocation}`;
    //       if (
    //         service.type === "Complaint" &&
    //         service.complaintUpdate.length > 0
    //       ) {
    //         let length = service.complaintUpdate.length - 1;
    //         row.getCell(1).value = "Complaint";
    //         row.getCell(2).value = moment(service.updatedAt)
    //           .local()
    //           .format("HH:mm:ss");
    //         row.getCell(3).value = location;
    //         row.getCell(4).value = service.complaintDetails.service.join(", ");
    //         row.getCell(5).value = "NA";
    //         row.getCell(6).value = service.complaintUpdate[length].status;
    //         row.getCell(7).value = service.complaintUpdate[length].comment;
    //         row.getCell(8).value = service.complaintUpdate[length].userName;
    //         row.getCell(9).value =
    //           (service.complaintUpdate[length].image.length >= 1 && {
    //             text: "Download",
    //             hyperlink: service.complaintUpdate[length].image[0],
    //           }) ||
    //           "No Image";
    //         row.getCell(10).value =
    //           (service.complaintUpdate[length].image.length >= 2 && {
    //             text: "Download",
    //             hyperlink: service.complaintUpdate[length].image[1],
    //           }) ||
    //           "No Image";
    //         row.commit();
    //       } else {
    //         for (let regular of service.regularService) {
    //           row.getCell(1).value = "Regular";
    //           row.getCell(2).value = moment(service.updatedAt)
    //             .local()
    //             .format("HH:mm:ss");
    //           row.getCell(3).value = location;
    //           row.getCell(4).value = regular.frequency;
    //           row.getCell(5).value = regular.serviceName;
    //           row.getCell(6).value = regular.scopes.map((sc) => sc.scopeName);
    //           row.getCell(7).value = regular.action;
    //           row.getCell(8).value = "NA";
    //           row.getCell(9).value = "NA";
    //           row.getCell(10).value = regular.userName;
    //           row.getCell(11).value =
    //             (regular.image.length > 1 && {
    //               text: "Download",
    //               hyperlink: regular.image,
    //             }) ||
    //             "No Image";
    //           row.commit();
    //         }
    //       }
    //     }

    //     const filePath = `./tmp/${client.name}_Daily_Service_Report.xlsx`;
    //     await workbook.xlsx.writeFile(filePath);
    //     // const link = await uploadFile({ filePath });
    //     // if (link) {
    //     //   await sendEmail({
    //     //     attachment: [
    //     //       {
    //     //         url: link,
    //     //         name: `${client.name}_Daily_Service_Report.xlsx`,
    //     //       },
    //     //     ],
    //     //     emailList: [{ email: client.email }],
    //     //     templateId: 1,
    //     //     dynamicData: {
    //     //       client: client.name,
    //     //       date: moment(yesterday).format("DD/MM/YY"),
    //     //     },
    //     //   });
    //     // }
    //   }
    // }

    return res.json({ msg: "Report generated", regulars,complaints });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
