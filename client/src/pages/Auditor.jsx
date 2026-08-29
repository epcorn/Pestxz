import AuditorForm from "../components/auditor/AuditorForm";
import { useForm } from "react-hook-form";
import { questions } from "../utils/auditorConstData";
import { useFormPersist } from "../components/auditor/useFormPersist";
import Button from "../components/Button";
import { useCreateAuditReportMutation } from "../redux/auditorSlice";
import { MoveLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


function Auditor() {
  const navigate = useNavigate();
  const { register, control, setValue, watch, reset, formState: { errors }, getValues, handleSubmit } =
    useForm({ defaultValues: { client: "" } });

  const { clearDraft } = useFormPersist({ watch, reset, getValues });

  const [submitReport, { isLoading: submitting }] =
    useCreateAuditReportMutation();

  const onSubmit = async (formData) => {
    const confirmation = confirm("Are your sure want to submit");
    if (!confirmation && confirmation === false) return 0;
    if (formData.client === "" || formData.client === null) { toast.error("Select Client Type"); return };
    console.log(formData.client)
    const isNew = formData.client === 'new'

    const siteKey = formData.siteType.value;

    const siteData = questions?.['mall'] || [];
    const meta = {
      clientType: formData.client,
      siteAddrss: formData.addrss,
      meetUp: formData.meetUp,
      client: isNew ? formData.clientName : formData.clientName.value,
      site: isNew ? `${formData.floor}-${formData?.location}` : `${formData.floor.value}-${formData?.location?.value}`,
      siteType: formData.siteType.value,
    };

    const sections = siteData.map((section) => {

      if (section.section === "Audit Risk Scoring Matrix") {
        const categories = section.questions.map((qn) => {
          const linkedSection = siteData.find((s) => s.sectionId === qn.id);

          const realQuesn = linkedSection.questions ?? [];
          const issues = realQuesn.filter(
            (q) => formData[`${q.id}_checks`] === "Yes",
          ).length;

          const achieved = realQuesn.length
            ? Math.round((issues / realQuesn.length) * qn.points)
            : 0;

          return { category: qn.category, points: qn.points, achieved, };
        });

        return {
          id: section.id,
          sectionId: "arsm6",
          section: section.section,
          categories,
          totalPoints: categories.reduce((sum, c) => sum + c.points, 0),
          totalAchieved: categories.reduce((sum, c) => sum + c.achieved, 0),
          summary: { yes: 0, no: 0, total: 0 }
        };
        console.log(categories)
      }

      const answeredqstns = section.questions.map((que) => ({
        id: que.id,
        question: formData[`${que.id}_question`] ?? que.question,
        checks: formData[`${que.id}_checks`] ?? null,
        comment: formData[`${que.id}_comment`] ?? "",
        recommendation: formData?.[`${que.id}_recommends`] ?? "",
        images: formData[`${que.id}_uploadedImages`] ?? [],
      }));
      const yesCount = answeredqstns.filter((q) => q.checks === "Yes").length;
      const noCount = answeredqstns.filter((q) => q.checks === "No").length;

      return {
        id: section.id,
        section: section.section,
        sectionId: section.sectionId,
        questions: answeredqstns,
        summary: { yes: yesCount, no: noCount, total: answeredqstns.length, },
      };
    });
    const payload = { meta, sections, };
    console.log(payload)
    clearDraft();

    try {
      const res = await submitReport(payload).unwrap();
      toast.success("Audit inspection report successful")
      navigate("/dashboard/stats")
      console.log(res, payload);
    } catch (error) {
      toast.error("Audit inspection report error")
      console.log(error);
    }
  };

  const resetForm = (e) => {
    e.preventDefault();
    const confirmation = confirm("Are your sure want to reset form");

    if (!confirmation && confirmation === false) return 0;
    reset();
  };
  return (
    <section className="max-w-6xl mx-auto">
      <form
        id="audit-form"
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error(errors);
        })}
        className="mx-auto space-y-4 bg-white">
        {/* Header */}
        <div className="sticky top-22 z-10 flex flex-col sm:flex-row sm:items-center bg-white justify-between gap-2 border-b border-gray-200 py-3 px-3">
          <div className="flex items-center gap-5">
            <MoveLeft className="hover:-translate-x-1 transition-all" onClick={() => navigate('dashboard/stats')} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Audit Assessment</h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
          </div>
          <div>
            <Button
              type="button"
              label="Reset Form"
              color="bg-red-600"
              onClick={resetForm}
            />
            <button
              form="audit-form"
              disabled={submitting}
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-60 text-sm font-semibold rounded-md transition">
              {submitting ? "Submitting..." : "Submit Audit"}
            </button>
          </div>
        </div>

        {/* Form Contents */}
        <AuditorForm
          register={register}
          watch={watch}
          setValue={setValue}
          control={control}
          errors={errors}
        />
      </form>
    </section>
  );
}

export default Auditor;
