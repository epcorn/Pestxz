import React from "react";
import InputRow from "../InputRow";

function Questions({ register, watch, control, data }) {

  const getScoreChecked = ({ outOf, total, checked }) => {
    // const score = (total / outOf) + checked
    return 'score';
  }

  return (
    <section className=" bg-white border border-slate-400 rounded-b-2xl shadow-sm">
      {/* Section Header */}
      <div className="sticky top-40 z-2 [corner-shape:scoop] rounded-b-2xl bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
          {data.section}
        </h3>
        <span className="text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono">
          {data.questns.length} Checkpoints
        </span>
      </div>

      {/* Questions Container */}
      {data.id.endsWith("6") && data.section === "Audit Risk Scoring Matrix" ? <div>
        <table className="table-auto min-w-full">
          <thead className="table-header-group *:not-last:border-r text-center border-b">
            <tr>
              <th>Sr. No.</th>
              <th>Categories</th>
              <th>Audit Points</th>
              <th>Score Achived</th>
            </tr>
          </thead>
          <tbody>
            {data.questns.map((qn, i) => (
              <tr key={qn.id} className="*:not-last:border-r text-center border-b border-b-gray-300 hover:bg-gray-200">
                <td>{i + 1}</td>
                <td>{qn.category}</td>
                <td>{qn.points}</td>
                <td>{getScoreChecked({ outOf: qn.points, total: data.questns.length })}</td>
              </tr>
            ))}
            <tr className="text-center font-bold border-t">
              <td></td>
              <td className="">Total</td>
              <td className=""></td>
              <td className=""></td>
            </tr>
          </tbody>
        </table>
      </div>
        :
        <div className="p-3 sm:p-4 space-y-4 bg-slate-50">
          {data.questns.map((que, i) => {
            const checks = watch(`${que.id}_checks`);
            const isCheckYes = checks === "Yes";
            const isCheckNo = checks === "No";

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
                {/* Question Text */}
                <InputRow
                  defaultValue={que.question}
                  id={`${que.id}_questn`}
                  label={`Check #${i + 1}`}
                  register={register}
                  inputCls="bg-slate-500 text-lg text-white font-semibold"
                />

                {/* Action Controls */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  {/* Answer Selector */}
                  <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Observation Result <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <InputRadio 
                        id={`${que.id}_yes`}
                        label="Yes (Issue)"
                        value="Yes"
                        name={`${que.id}_checks`}
                        register={register}
                      />
                      <InputRadio
                        id={`${que.id}_no`}
                        label="No (Pass)"
                        value="No"
                        name={`${que.id}_checks`}
                        register={register}
                      />
                    </div>
                  </div>

                  {/* Evidence Upload */}
                  <div className="md:col-span-2">
                    <InputRow
                      type="file"
                      register={register}
                      id={`${que.id}_images`}
                      label="Attach Evidence / Photo"
                      required={false}
                      inputCls="file:bg-slate-700 file:hover:bg-slate-800 file:text-white file:px-3 file:py-1 file:rounded-md file:border-0 file:cursor-pointer text-xs text-slate-600"
                    />
                  </div>
                </div>

                {/* Detailed Auditor Remarks */}
                {checks && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-lg">
                    <InputRow
                      label="Auditor's Findings / Comment"
                      register={register}
                      id={`${que.id}_comment`}
                      defaultValue={isCheckYes ? que.comments : ""}
                      required={false}
                      placeholder="Describe severity or condition..."
                      inputCls=''
                    />
                    <InputRow
                      label="Corrective Action / Recommendation"
                      register={register}
                      required={false}
                      id={`${que.id}_recommends`}
                      defaultValue={isCheckYes ? que.recommnds : ""}
                      placeholder="Action required by client..."
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>}
    </section>
  );
}

export default Questions;

function InputRadio({ register, label, value, id, name }) {
  const isYes = value === "Yes";

  return (
    <div className="flex items-center">
      <input
        type="radio"
        id={id}
        value={value}
        {...register(name)}
        className="peer hidden"
      />

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