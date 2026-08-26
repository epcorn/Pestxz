import { useState } from "react";
import { useImgUploaderMutation } from "@/redux/adminSlice";
import { toast } from "react-toastify";
import InputRow from "../InputRow";

function Questions({ register, watch, data, setValue, scoreBySectionId, errors }) {
  const isMatrix = data.section === "Audit Risk Scoring Matrix";
  const [upload] = useImgUploaderMutation();
  const [readonly, setReadOnly] = useState(null)
  const [uploadingIds, setUploadingIds] = useState({}); // per-question loading state

  const matrixCategories = isMatrix ? Object.values(scoreBySectionId) : [];
  const total = matrixCategories.reduce((acc, val) => acc + (val.achieved || 0), 0);

  const handleImgChange = async (e, questionId) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingIds(prev => ({ ...prev, [questionId]: true }));

    const formData = new FormData();
    files.forEach(file => formData.append("image", file));

    try {
      const res = await upload(formData).unwrap();
      // Correct accumulator: read from the field we actually WRITE to
      const currentUrls = watch(`${questionId}_uploadedImages`) || [];

      const newUrls = res?.urls
        ? res.urls
        : res?.url
          ? [res.url]
          : [];

      if (newUrls.length) {
        setValue(`${questionId}_uploadedImages`, [...currentUrls, ...newUrls]);
      } else {
        toast.error("Upload succeeded but no image URL was returned.");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploadingIds(prev => ({ ...prev, [questionId]: false }));

      e.target.value = "";
    }
  };

  const handleRemoveImage = (questionId, urlToRemove) => {
    const currentUrls = watch(`${questionId}_uploadedImages`) || [];
    setValue(
      `${questionId}_uploadedImages`,
      currentUrls.filter(url => url !== urlToRemove)
    );
  };

  return (
    <section className=" border border-slate-400 rounded-b-2xl shadow-sm">
      <div className="sticky top-40 z-5 rounded-b-2xl [corner-shape:scoop] bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">{data.section}</h3>
        <p className="flex items-center gap-5">
          <span className="text-slate-300 text-sm">{data.questions?.length || 0} Checkpoints</span>
          {scoreBySectionId?.[data.sectionId] && (
            <span className="text-white">{scoreBySectionId[data.sectionId]?.achieved} - Scores</span>
          )}
        </p>
      </div>

      {isMatrix ? (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-center">Sr. No.</th>
              <th className="py-2">Category</th>
              <th className="py-2 text-center">Points</th>
              <th className="py-2 text-center">Achieved</th>
            </tr>
          </thead>
          <tbody>
            {matrixCategories?.map((cat, i) => (
              <tr key={cat.id} className="border-b">
                <td className="py-2 text-center">{i + 1}</td>
                <td className="py-2">{cat.category}</td>
                <td className="py-2 text-center">{cat.points}</td>
                <td className="py-2 text-center">{cat.achieved}</td>
              </tr>
            ))}
            <tr>
              <th></th>
              <th className="text-right pr-10 text-lg">Total</th>
              <th className="text-center">100</th>
              <th className="text-center">{total}</th>
            </tr>
          </tbody>
        </table>
      ) : (
        <div className="p-3 sm:p-4 space-y-4">
          {data.questions.map((que, i) => {
            const checks = watch(`${que.id}_checks`);
            const uploadedImages = watch(`${que.id}_uploadedImages`) || [];
            const isUploading = !!uploadingIds[que.id];
            const isCheckYes = checks === "Yes";
            const isCheckNo = checks === "No";
            const isReadOnly = que.id !== readonly

            return (
              <div
                key={que.id}
                className={`transition-all duration-200 border rounded-lg p-3 sm:p-4 bg-white shadow-xs ${isCheckYes
                  ? "border-l-4 border-l-red-500 border-red-200 bg-red-50/20"
                  : isCheckNo
                    ? "border-l-4 border-l-emerald-500 border-slate-200"
                    : "border-slate-200"
                  }`}
              >
                <InputRow
                  defaultValue={que.question}
                  id={`${que.id}_question`}
                  label={`Check #${i + 1}`}
                  register={register}
                  inputCls="bg-[#2e5791] text-lg text-white font-semibold font-mono"
                  readOnly={isReadOnly}
                  required={false}
                  onDoubleClick={(e) => setReadOnly(que.id)}
                  onBlur={() => setReadOnly(null)}
                />

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="bg-slate-100 p-2 rounded-lg border border-slate-500">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Observation<span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 *:outline *:rounded-lg *:outline-gray-400">
                      <InputAuditRadio
                        id={`${que.id}_yes`}
                        label="Yes (Issue)"
                        value="Yes"
                        name={`${que.id}_checks`}
                        register={register}
                      />
                      <InputAuditRadio
                        id={`${que.id}_no`}
                        label="No (Pass)"
                        value="No"
                        name={`${que.id}_checks`}
                        register={register}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-2 gap-2 w-full">
                    <InputRow
                      multiple accept="image/*"
                      type="file"
                      register={register}
                      id={`${que.id}_images`}
                      label={isUploading ? "Uploading..." : "Attach Evidence / Photo"}
                      required={false}
                      onChange={(e) => handleImgChange(e, que.id)}
                      disabled={isUploading}
                      inputCls="shrink-0 file:bg-slate-700 max-w-52 file:hover:bg-slate-800 file:text-white file:px-3 file:py-1 file:rounded-md file:border-0 file:cursor-pointer text-xs text-slate-600 disabled:opacity-80"
                    />

                    {/* Uploaded image previews */}
                    {uploadedImages.length > 0 && (
                      <div className="mt-2 flex w-full gap-2 overflow-x-auto overflow-y-visible">
                        {uploadedImages?.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={url}
                              alt={`evidence-${idx}`}
                              className="w-16 h-16 object-cover rounded border border-slate-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(que.id, url)}
                              className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {checks && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-lg">
                    <InputRow
                      label="Auditor's Findings / Comment"
                      register={register}
                      id={`${que.id}_comment`}
                      defaultValue={isCheckYes ? que?.comment : ""}
                      required={false}
                      placeholder="Describe severity or condition..."
                      inputCls=""
                    />
                    <InputRow
                      label="Corrective Action / Recommendation"
                      register={register}
                      required={false}
                      id={`${que.id}_recommends`}
                      defaultValue={isCheckYes ? que?.recommendation : ""}
                      placeholder="Action required by client..."
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Questions;

export function InputAuditRadio({ register, label, value, id, name }) {
  const isYes = value === "Yes";
  return (
    <div className="flex items-center">
      <input type="radio" id={id} value={value} {...register(name)} className="peer hidden" />
      <label
        role="button"
        htmlFor={id}
        className={`w-full text-center cursor-pointer text-xs font-semibold px-2 py-2 rounded-md transition-all border border-transparent select-none bg-white text-slate-700 shadow-xs
          peer-checked:font-bold
          ${isYes
            ? "peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-700"
            : "peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-700"
          }
        `}
      >
        {label}
      </label>
    </div>
  );
}