import { Controller } from 'react-hook-form';
import { useAllClientsQuery } from '../../redux/clientSlice';
import { useMemo, useEffect } from 'react';
import InputRow from '../InputRow';
import InputSelect from '../InputSelect';
import { questions } from '../../utils/auditorConstData';
import Questions from './Questions';

function AuditorForm({ register, watch, control, setValue }) {
  const { data = [] } = useAllClientsQuery();

  const siteOptions = [
    { label: "Hospital", value: "hospital" },
    { label: "Mall", value: "mall" },
    { label: "Hotel", value: "hotel" },
    { label: "Restaurant", value: "restaurant" },
    { label: "Residential", value: "residential" },
  ];

  const selectedClient = watch('clientName');
  const selectedFloor = watch('floor');
  const selectedLocation = watch('location');
  const selectedSite = watch('site');
  const siteData = questions?.[selectedSite?.value?.toLowerCase()] || {};

  const clientOptions = useMemo(() => {
    return data.map(client => ({
      value: client?._id || client?.id,
      label: client?.name,
    }));
  }, [data]);

  const currentClient = useMemo(() => {
    if (!selectedClient?.value) return null;
    return data.find(
      client =>
        client?._id === selectedClient.value ||
        client?.id === selectedClient.value
    );
  }, [data, selectedClient?.value]);

  const floorOptions = useMemo(() => {
    if (!currentClient?.locations) return [];
    const floors = [
      ...new Set(
        currentClient.locations
          .map(location => location?.floor)
          .filter(Boolean)
      ),
    ];
    return floors.map(floor => ({ value: floor, label: floor }));
  }, [currentClient]);

  const locationOptions = useMemo(() => {
    if (!currentClient?.locations || !selectedFloor?.value) return [];
    const locations = [
      ...new Set(
        currentClient.locations
          .filter(location => location?.floor === selectedFloor.value)
          .map(location => location?.location)
          .filter(Boolean)
      ),
    ];
    return locations.map(location => ({ value: location, label: location }));
  }, [currentClient, selectedFloor?.value]);

  const subLocationOptions = useMemo(() => {
    if (!currentClient?.locations || !selectedLocation?.value) return [];
    const subLocations = [
      ...new Set(
        currentClient.locations
          .filter(
            location =>
              location?.floor === selectedFloor?.value &&
              location?.location === selectedLocation.value
          )
          .map(location => location?.subLocation)
          .filter(Boolean)
      ),
    ];
    return subLocations.map(subLocation => ({
      value: subLocation,
      label: subLocation,
    }));
  }, [currentClient, selectedFloor?.value, selectedLocation?.value]);

  useEffect(() => {
    setValue('floor', floorOptions[0]);
    setValue('location', null);
    setValue('subLocation', null);
  }, [selectedClient?.value]);

  useEffect(() => {
    setValue('location', locationOptions[0]);
    setValue('subLocation', null);
  }, [selectedFloor?.value]);

  useEffect(() => {
    setValue('subLocation', subLocationOptions[0]);
  }, [selectedLocation?.value]);

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
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono border border-slate-700">
            INSPECTION MODE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Controller
              control={control}
              name="clientName"
              render={({ field: { onChange, value } }) => (
                <InputSelect
                  label="Target Client"
                  onChange={onChange}
                  value={value}
                  options={clientOptions}
                  required={false}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="floor"
            render={({ field: { onChange, value } }) => (
              <InputSelect
                label="Floor"
                onChange={onChange}
                value={value}
                options={floorOptions}
                required={false}
              />
            )}
          />

          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, value } }) => (
              <InputSelect
                label="Primary Location"
                onChange={onChange}
                value={value}
                options={locationOptions}
                required={false}
              />
            )}
          />

          <Controller
            control={control}
            name="subLocation"
            render={({ field: { onChange, value } }) => (
              <InputSelect
                label="Sub-Location"
                onChange={onChange}
                value={value}
                options={subLocationOptions}
                required={false}
              />
            )}
          />

          <Controller
            control={control}
            name="site"
            render={({ field: { onChange, value } }) => (
              <InputSelect
                label="Site Category"
                onChange={onChange}
                value={value}
                options={subLocationOptions.length > 0 ? siteOptions : []}
                required={false}
              />
            )}
          />

          <InputRow
            type="text"
            register={register}
            id="inspectBy"
            label="Auditor Full Name"
            placeholder="e.g. John Doe (ID: 4022)"
            required={false}
          />

          <InputRow
            type="date"
            register={register}
            id="inspectionDate"
            label="Inspection Date"
            required={true}
            min={new Date().toISOString().split("T")[0]}
            disabled={true}
            required={false}
          />
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-6">
        {siteData?.length > 0 &&
          siteData.map(data => (
            <Questions
              key={data.id}
              watch={watch}
              control={control}
              data={data}
              register={register}
            />
          ))}
      </div>

      <input type="submit" value={'submit'} />
    </div>
  );
}

export default AuditorForm;