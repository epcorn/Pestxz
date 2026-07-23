export const dailyServiceReport = async (req, res) => {
  // const id = req.user.client ? req.user.client : null;
  // const date = new Date();
  // const today = date.setUTCHours(0, 0, 0, 0);
  // const yesterday = new Date(
  //   date.getFullYear(),
  //   date.getMonth(),
  //   date.getDate(),
  // ).setUTCHours(0, 0, 0, 0);

  // const clients = await Client.find().populate({
  //   path: "services",
  //   match: {
  //     updatedAt: {
  //       $gte: yesterday,
  //       $lt: today,
  //     },
  //   },
  //   populate: {
  //     path: "location",
  //   },
  // });
  // let regulars, complaints;
  // for (let service of clients) {
  //   regulars = service.services.filter((s) => s.type === "Regulars");
  //   complaints = service.services.filter((s) => s.type === "Complaint");
  // for(i=0;i<regulars.length;i++){

  // }
  // }

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

  try {
    const { value = "monthly" } = req.params;
    const { today } = req.query;

    const todayStart = today ? new Date(today) : new Date();
    todayStart?.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const isPestEmployee = req.user.type === "PestEmployee";
    const clientQuery =
      req.user.role === "ClientAdmin" ? { _id: req.user.client } : {};
    const selectFields = req.user.client ? "" : "-adminPass";

    let matchCondition = {};
    let scheduleDateMatch = {};
    let prodScheduleDateMatch = {};

    if (value === "custom") {
      matchCondition = {
        updatedAt: { $gte: todayStart, $lte: todayEnd },
      };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: todayStart, $lte: todayEnd },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: todayStart, $lte: todayEnd },
      };
    } else if (value === "weekly") {
      const weekEnd = new Date(todayStart);
      const weekStart = new Date(todayStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - 7);
      matchCondition = {
        updatedAt: { $gte: weekStart, $lt: weekEnd },
      };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: weekStart, $lt: weekEnd },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: weekStart, $lte: weekEnd },
      };
    } else if (value === "fortnightly") {
      const fortnightEnd = new Date(todayStart); // Exclusive boundary
      const fortnightStart = new Date(todayStart);
      fortnightStart.setUTCDate(fortnightStart.getUTCDate() - 14); //
      matchCondition = {
        updatedAt: { $gte: fortnightStart, $lt: fortnightEnd },
      };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: fortnightStart, $lt: fortnightEnd },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: fortnightStart, $lte: fortnightEnd },
      };
    } else if (value === "monthly") {
      // 1. Get the year and month of the PREVIOUS month
      const prevMonthYear =
        todayStart.getUTCMonth() === 0
          ? todayStart.getUTCFullYear() - 1
          : todayStart.getUTCFullYear();
      const prevMonthIndex =
        todayStart.getUTCMonth() === 0 ? 11 : todayStart.getUTCMonth() - 1;
      const monthStart = new Date(Date.UTC(prevMonthYear, prevMonthIndex, 1));
      const monthEnd = new Date(
        Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1),
      );
      matchCondition = {
        updatedAt: { $gte: monthStart, $lt: monthEnd },
      };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: monthStart, $lt: monthEnd },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: monthStart, $lte: monthEnd },
      };
    }

    const populateOptions = [
      {
        path: "services",
        match: matchCondition,
        populate: { path: "location" },
      },
      { path: "locations" },
      {
        path: "unschedules",
        match: matchCondition,
        populate: { path: "location" },
      },
      {
        path: "casuals",
        match: matchCondition,
        populate: { path: "location" },
      },
      {
        path: "productservices",
        match: matchCondition,
        populate: { path: "location" },
      },
    ];

    // Use .cursor() & .lean() so Mongo yields one document at a time
    const clientCursor = Client.find(clientQuery)
      .select(selectFields)
      .populate(populateOptions)
      .lean()
      .cursor();

    const sufix =
      value === "all" ? "All" : todayStart.toISOString().split("T")[0];
    const generatedFiles = [];

    const dir = "./tmp/reports";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for await (let client of clientCursor) {
      const clientName = client.name.replace(/[\s\/]+/g, "_");
      const fileName = `${clientName}_Daily_Service_Report-${sufix}.xlsx`;
      const filePath = `./tmp/reports/${fileName}`;

      // Aggregations
      const serviceStatusAgg = await Location.aggregate([
        { $match: { client: client._id } },
        { $unwind: "$service" },
        { $unwind: "$service.schedule" },
        ...(value !== "all" ? [{ $match: scheduleDateMatch }] : []),
        { $group: { _id: "$service.schedule.status", count: { $sum: 1 } } },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]);

      const regStats = { missed: 0, done: 0, pending: 0, location: 0 };
      serviceStatusAgg.forEach((s) => {
        const key = s.label?.trim()?.toLowerCase();
        if (key && key in regStats) regStats[key] = s.count;
      });

      const prodStatusAgg = await Location.aggregate([
        { $match: { client: client._id } },
        { $unwind: "$product" },
        { $unwind: "$product.schedule" },
        ...(value !== "all" ? [{ $match: prodScheduleDateMatch }] : []),
        { $group: { _id: "$product.schedule.status", count: { $sum: 1 } } },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]);

      const prodStats = { missed: 0, done: 0, pending: 0, location: 0 };
      prodStatusAgg.forEach((s) => {
        const key = s.label?.trim()?.toLowerCase();
        if (key && key in prodStats) prodStats[key] = s.count;
      });

      // --- Complaint status rollup (mirrors adminDashboard) ---
      const complaints =
        client.services?.filter((s) => s.type === "Complaint") || [];
      const complaintData = complaints.reduce(
        (acc, complaint) => {
          const { status, reopenCount = 0 } = complaint.complaintDetails || {};
          if (status === "Open") acc.open++;
          else if (status === "In Progress") acc.inProgress++;
          else if (status === "Close Req") acc.closeReq++;
          else if (status === "Close") acc.closed++;
          acc.reopenCount += reopenCount;
          acc.total++;
          return acc;
        },
        {
          total: 0,
          open: 0,
          closeReq: 0,
          closed: 0,
          inProgress: 0,
          reopenCount: 0,
        },
      );

      if (client.reportUrl) {
        await removeOldQr(client.reportUrl);
      }

      // ✅ LOAD EXISTING TEMPLATE FILE
      const workbook = new exceljs.Workbook();
      const templatePath = isPestEmployee
        ? "./tmp/dailyReport_Pest.xlsx"
        : "./tmp/dailyReport_Client.xlsx";

      await workbook.xlsx.readFile(templatePath);

      const overviewWorkSheet = workbook.getWorksheet("Overview");
      const regularWorksheet = workbook.getWorksheet("Regular service");
      const complaintWorksheet = workbook.getWorksheet("Complaints");
      const unschWorksheet = workbook.getWorksheet("Unscheduled-Work");

      // Populate Overview
      if (overviewWorkSheet) {
        const row4 = overviewWorkSheet.getRow(4);
        row4.getCell(1).value = regStats.done;
        row4.getCell(2).value = regStats.missed;
        row4.getCell(3).value = regStats.pending;

        //complaints
        row4.getCell(6).value = complaintData.total;
        row4.getCell(7).value = complaintData.open;
        row4.getCell(8).value = complaintData.closed;
        row4.getCell(9).value = complaintData.reopenCount;
        row4.getCell(10).value = complaintData.closeReq;

        row4.getCell(12).value = prodStats?.done;
        row4.getCell(13).value = prodStats?.missed;
        row4.getCell(14).value = prodStats?.pending;
        row4.commit();
      }

      // Populate Complaints directly without pre-mapping full arrays
      if (complaintWorksheet) {
        let compRow = 4;
        const complaints =
          client.services?.filter((s) => s.type === "Complaint") || [];

        for (const com of complaints) {
          const comp = com.complaintDetails || {};
          const updt = com.complaintUpdate?.at(-1) || {};
          const loc = com.location || {};

          const row = complaintWorksheet.getRow(compRow);
          row.getCell(1).value = updt.date
            ? new Date(updt.date).toLocaleString()
            : "N/A";
          row.getCell(2).value = comp.number || "N/A";
          row.getCell(3).value = Array.isArray(comp.service)
            ? comp.service.join(", ")
            : "N/A";
          row.getCell(4).value = comp.assignedTo?.userName || "Unassigned";
          row.getCell(5).value =
            `${loc.floor || ""}, ${loc.location || ""}, ${loc.subLocation || ""}`;
          row.getCell(6).value = comp.comment || "";
          row.getCell(7).value = comp.status || "Open";
          row.getCell(8).value = comp.reopenCount || 0;
          row.commit();
          compRow++;
        }
      }

      // Populate Regular Services directly
      if (regularWorksheet) {
        let currRow = 4;
        const regulars =
          client.services?.filter((s) => s.type === "Regular") || [];

        for (const reg of regulars) {
          const regs = reg.regularService?.[0];
          if (!regs) continue;
          const loc = reg.location || {};
          const { date, time } = dateTimeSplitter(regs.serviceDate);

          const row = regularWorksheet.getRow(currRow);
          row.getCell(1).value = date;
          row.getCell(2).value = time;
          row.getCell(3).value = regs.frequency;
          row.getCell(4).value = regs.userName;
          row.getCell(5).value =
            `${loc.floor || ""}, ${loc.location || ""}, ${loc.subLocation || ""}`;
          row.getCell(6).value = regs.serviceName;

          if (isPestEmployee) {
            // Restore Scopes & Calibration for Pest Employee
            row.getCell(7).value = Array.isArray(regs.scopes)
              ? regs.scopes
                  .flatMap((sc) =>
                    Array.isArray(sc?.consumables)
                      ? sc.consumables.map(
                          (con) =>
                            `${sc.scopeName || ""} -> ${con.consumableName || ""} -> ${con.calibration || 0} -> ${con.usedCalibration || 0} -> ${con.action || ""}`,
                        )
                      : [],
                  )
                  .join("\n") // Creates a line break after every single consumable iteration
              : "";
            row.getCell(7).alignment = { wrapText: true };
            row.getCell(8).value = Array.isArray(regs.image)
              ? regs.image.join(", ")
              : regs.image || "";
          } else {
            // Image URL(s) for Non-Pest Employee
            row.getCell(7).value = Array.isArray(regs.image)
              ? regs.image.join(", ")
              : regs.image || "";
          }

          row.commit();
          currRow++;
        }
      }

      // Populate Unscheduled Work
      if (unschWorksheet) {
        let unschCount = 4;
        for (const unsc of client.unschedules || []) {
          const loc = unsc.location || {};
          const row = unschWorksheet.getRow(unschCount);
          row.getCell(1).value = unsc.createdAt
            ? new Date(unsc.createdAt).toLocaleString()
            : "";
          row.getCell(2).value = unsc.updatedAt
            ? new Date(unsc.updatedAt).toLocaleString()
            : "";
          row.getCell(3).value =
            `${loc.floor || ""}, ${loc.location || ""}, ${loc.subLocation || ""}`;
          row.getCell(4).value = unsc.serviceName || "";
          row.getCell(5).value = unsc.raisedBy?.user || "";
          row.getCell(6).value = unsc.approval?.name || "";
          row.getCell(7).value = unsc.comment || "";
          row.getCell(8).value = unsc.update?.status || "";
          row.commit();
          unschCount++;
        }
      }

      // Save output report file
      await workbook.xlsx.writeFile(filePath);

      const uploadURL = await uploadFile({ filePath });
      if (uploadURL) {
        await Client.findByIdAndUpdate(client._id, { reportURL: uploadURL });
        generatedFiles.push({ client: client.name, url: uploadURL });
      }

      // Clean up generated file on disk
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Force garbage collector if exposed
      if (global.gc) {
        global.gc();
      }
    }

    return res.json({
      msg: `Report generated for ${value}`,
      files: generatedFiles,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
