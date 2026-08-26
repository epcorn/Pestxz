import { Controller } from "react-hook-form";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { useMemo, useEffect } from "react";
import InputRow from "../InputRow";
import InputSelect from "../InputSelect";
import { questions } from "../../utils/auditorConstData";
import Questions from "./Questions";
import { useSelector } from "react-redux";
import InputRadio from "../InputRadio";

function AuditorForm({ register, watch, control, setValue, errors }) {
  const isNew = watch("client");

  const { data = [] } = useAllClientsQuery({ skip: isNew !== "old" || !isNew });

  const { user } = useSelector((store) => store.helper);

  const siteOptions = [
    { label: "Hospital", value: "hospital" },
    { label: "Mall", value: "mall" },
    { label: "Hotel", value: "hotel" },
    { label: "Restaurant", value: "restaurant" },
    { label: "Residential", value: "residential" },
  ];

  const formData = watch();
  const selectedClient = watch("clientName");
  const selectedFloor = watch("floor");

  useEffect(() => { setValue("client", null) }, [])
  const siteData = questions?.['mall'] || [];

  const clientOptions = useMemo(() => {
    return data.map((client) => ({
      value: client?._id || client?.id,
      label: client?.name,
    }));
  }, [data]);

  const currentClient = useMemo(() => {
    if (!selectedClient?.value) return null;
    return data.find(
      (client) =>
        client?._id === selectedClient.value ||
        client?.id === selectedClient.value,
    );
  }, [data, selectedClient?.value]);

  const floorOptions = useMemo(() => {
    if (!currentClient?.locations) return [];
    const floors = [
      ...new Set(
        currentClient.locations
          .map((location) => location?.floor)
          .filter(Boolean),
      ),
    ];
    return floors.map((floor) => ({ value: floor, label: floor }));
  }, [currentClient]);

  const locationOptions = useMemo(() => {
    if (!currentClient?.locations || !selectedFloor?.value) return [];
    const locations = [
      ...new Set(
        currentClient.locations
          .filter((location) => location?.floor === selectedFloor.value)
          .map((location) => location?.location)
          .filter(Boolean),
      ),
    ];
    return locations.map((location) => ({ value: location, label: location }));
  }, [currentClient, selectedFloor?.value]);

  useEffect(() => {
    setValue("floor", floorOptions[0]);
    setValue("location", null);
  }, [selectedClient?.value, floorOptions]);

  useEffect(() => {
    setValue("location", locationOptions[0]);
  }, [selectedFloor?.value, locationOptions]);

  const matrixSection = siteData?.find(
    (s) => s.section === "Audit Risk Scoring Matrix",
  );

  const scoreBySectionId = useMemo(() => {
    if (!matrixSection?.questions) return {};

    return matrixSection.questions.reduce((acc, q) => {
      const linkedSection = siteData?.find((s) => s.sectionId === q.id);
      const questionsList = linkedSection?.questions ?? [];

      const checkedCount = questionsList.filter(
        (rq) => formData[`${rq.id}_checks`] === "Yes",
      ).length;

      const achieved = questionsList.length
        ? Math.round((checkedCount / questionsList.length) * q.points)
        : 0;
      acc[q.id] = { ...q, achieved };
      return acc;
    }, {});
  }, [siteData, formData, matrixSection]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 sm:p-4 bg-slate-100 rounded-xl">
      {[null, undefined, "null", "", "undefined"].includes(isNew) && (
        <div className="flex items-center w-fit mx-auto gap-3 outline px-2 bg-white font-semibold text-black text-sm rounded-sm">
          <h4>Select Client type: </h4>
          <InputRadio
            register={register}
            id="old"
            block={false}
            value="old"
            name="client"
            label="Existing"
            required={true}
            errors={errors}
          />
          <InputRadio
            register={register}
            id="new"
            value="new"
            name="client"
            block={false}
            label="New"
            required={true}
            errors={errors}
          />
        </div>
      )}
      {/* Header Info Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <h2 className="text-lg font-bold tracking-wide uppercase text-slate-100">
              Audit Scope & Location
            </h2>
          </div>


          <span className="text-xs hidden sm:block bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono border border-slate-500">
            INSPECTION MODE
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3 p-4">
          {/* Client Name: Full width on mobile, 8 columns wide on desktop */}
          <div className="md:col-span-8">
            {isNew === "new" ? (
              <InputRow
                register={register}
                id="clientName"
                label="Client Name"
                placeholder="ex. Nanavati Hospital"
                required={true}
              />
            ) : (
              <Controller
                control={control}
                name="clientName"
                render={({ field: { onChange, value } }) => (
                  <InputSelect label="Client Name" onChange={onChange} value={value} options={clientOptions} required={true} />
                )}
              />
            )}
          </div>
          {/* Site Category: Full width on mobile, 4 columns wide on desktop */}
          <div className="md:col-span-4">
            <Controller
              control={control}
              name="siteType"
              render={({ field: { onChange, value } }) => (
                <InputSelect label="Site Category" onChange={onChange} value={value} options={siteOptions} required={true} />
              )}
            />
          </div>
          {/* Site Location (Primary): Half width on desktop */}
          <div className="md:col-span-6">
            {isNew === "new" ? (
              <InputRow
                register={register}
                id="floor"
                label="Site Location (Primary)"
                placeholder="ex. 2nd floor"
                required={true}
              />
            ) : (
              <Controller
                control={control}
                name="floor"
                render={({ field: { onChange, value } }) => (
                  <InputSelect label="Site Location (Primary)" onChange={onChange} value={value} options={floorOptions} required={true} />
                )}
              />
            )}
          </div>
          {/* Site Location (Secondary): Half width on desktop */}
          <div className="md:col-span-6">
            {isNew === "new" ? (
              <InputRow
                register={register}
                id="location"
                label="Site Location (secondary)"
                placeholder="ex. operation theater"
                required={true}
              />
            ) : (
              <Controller
                control={control}
                name="location"
                render={({ field: { onChange, value } }) => (
                  <InputSelect label="Site Location (secondary)" onChange={onChange} value={value} options={locationOptions} required={true} />
                )}
              />
            )}
          </div>
          {/* Auditor Full Name: Half width on desktop */}
          <div className="md:col-span-4">
            <InputRow
              type="text"
              register={register}
              id="inspectBy"
              label="Auditor Full Name"
              readOnly
              inputCls="rounded-sm! read-only:bg-gray-200"
              value={user?.name || "Auditor Not found"}
              required={true}
            />
          </div>
          <div className="md:col-span-4">
            <InputRow
              type="text"
              register={register}
              id="meetUp"
              label="Meet at site"
              required={true}
            />
          </div>
          {/* Address: Half width on desktop */}
          <div className="md:col-span-4">
            <InputRow
              type="text"
              register={register}
              id="addrss"
              label="Address"
              required={true}
            />
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-6">
        {siteData.length > 0 &&
          siteData.map((data) => (
            <Questions
              key={data.id}
              watch={watch}
              control={control}
              data={data}
              setValue={setValue}
              allSections={siteData}
              register={register}
              errors={errors}
              scoreBySectionId={scoreBySectionId}
            />
          ))}
      </div>
    </div>
  );
}

export default AuditorForm;
