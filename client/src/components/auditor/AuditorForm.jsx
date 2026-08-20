import { Controller } from "react-hook-form";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { useMemo, useEffect } from "react";
import InputRow from "../InputRow";
import InputSelect from "../InputSelect";
import { questions } from "../../utils/auditorConstData";
import Questions from "./Questions";
import { useSelector } from "react-redux";
import InputRadio from "../InputRadio";

function AuditorForm({ register, watch, control, setValue }) {
  const { data = [] } = useAllClientsQuery();
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
  const selectedLocation = watch("location");
  const selectedSite = watch("siteType");
  const isNew = watch("client");

  useEffect(() => { setValue("client", null) }, [])
  const siteData = questions?.[selectedSite?.value?.toLowerCase()] || [];

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
  }, [selectedClient?.value]);

  useEffect(() => {
    setValue("location", locationOptions[0]);
    setValue("subLocation", null);
  }, [selectedFloor?.value]);

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
    <div className="max-w-7xl mx-auto space-y-6 p-2 sm:p-4 bg-slate-100 rounded-xl">
      {/* Header Info Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <h2 className="text-lg font-bold tracking-wide uppercase text-slate-100">
              Audit Scope & Location
            </h2>
          </div>

          {isNew === null && <div className="flex items-center gap-3 outline px-2 bg-white/40 text-black rounded-sm">
            <InputRadio
              register={register}
              id={"old"}
              block={false}
              value="old"
              name="client"
              label={"Exisitng"}
            />
            <InputRadio
              register={register}
              id={"new"}
              value="new"
              name="client"
              block={false}
              label={"New"}
            />
          </div>}
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono border border-slate-700">
            INSPECTION MODE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 p-4">
          <div className="sm:col-span-2 lg:col-span-1">
            {isNew === "new" ? (
              <InputRow
                register={register}
                id={"clientName"}
                label="Client Name"
                placeholder="ex. Nanavati Hospital"
              />
            ) : (
              <Controller
                control={control}
                name="clientName"
                render={({ field: { onChange, value } }) => (
                  <InputSelect
                    label="Client Name"
                    onChange={onChange}
                    value={value}
                    options={clientOptions}
                    required={false}
                  />
                )}
              />
            )}
          </div>

          {isNew === "new" ? (
            <InputRow
              register={register}
              id={"floor"}
              label="Site Location (Primary)"
              placeholder="ex. 2nd floor"
            />
          ) : (
            <Controller
              control={control}
              name="floor"
              render={({ field: { onChange, value } }) => (
                <InputSelect
                  label="Site Location (Primary)"
                  onChange={onChange}
                  value={value}
                  options={floorOptions}
                  required={false}
                />
              )}
            />
          )}

          {isNew === "new" ? (
            <InputRow
              register={register}
              id={"location"}
              label="Site Location (secondary)"
              placeholder="ex. operation theater"
            />
          ) : (
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, value } }) => (
                <InputSelect
                  label="Site Location (secondary)"
                  onChange={onChange}
                  value={value}
                  options={locationOptions}
                  required={false}
                />
              )}
            />
          )}
          <Controller
            control={control}
            name="siteType"
            render={({ field: { onChange, value } }) => (
              <InputSelect
                label="Site Category"
                onChange={onChange}
                value={value}
                options={siteOptions}
                required={false}
              />
            )}
          />

          <InputRow
            type="text"
            register={register}
            id="inspectBy"
            label="Auditor Full Name"
            disabled
            value={user?.name || "Auditor Not found"}
            required={false}
          />

          <InputRow
            type="date"
            register={register}
            id="inspectionDate"
            label="Inspection Date"
            cls="hidden"
            min={new Date().toISOString().split("T")[0]}
            disabled={true}
            required={false}
          />
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
              allSections={siteData}
              register={register}
              scoreBySectionId={scoreBySectionId}
            />
          ))}
      </div>
    </div>
  );
}

export default AuditorForm;
