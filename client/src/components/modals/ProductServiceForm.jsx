import React from 'react'
import { useForm } from 'react-hook-form'
import Button from '../Button'
import { productCalibrationMapping } from '../../utils/constData'
import InputRadio from '../InputRadio'
import { useImgUploaderMutation } from '../../redux/adminSlice'
import { useParams } from 'react-router-dom'
import { useAddProductServiceMutation } from '../../redux/serviceSlice'
import { useDispatch, useSelector } from 'react-redux'
import { selectDates, toggleModal } from '../../redux/helperSlice'
import { toast } from 'react-toastify'
import { ExpandedProductLists } from '../ProductLists'
import { useSingleLocationDetailsQuery } from '../../redux/locationSlice'
import { socket } from '../../socket'

function ProductServiceForm({ products, currentUser }) {

  const { id } = useParams()
  const [submittedIds, setSubmittedIds] = React.useState([])
  const dates = useSelector(selectDates)

  const todayLocal = new Date().toLocaleDateString('sv-SE');
  const queue = products?.filter(p => {
    if (submittedIds.includes(p._id)) return false;
    return p.schedule?.some(sc => {
      if (!sc.date) return false;
      const scheduleLocalDate = new Date(sc.date).toLocaleDateString('sv-SE');
      return scheduleLocalDate === todayLocal && !sc.completed;
    });
  }) || [];


  const handleSubmitted = (pid) => {
    setSubmittedIds(prev => [...prev, pid])
  }

  return (
    <div className="bg-slate-300 max-w-4xl border-2 rounded-lg mx-auto p-2 md:p-5">
      <div>
        {queue.length > 0 &&
          <h3 className="font-semibold text-2xl mb-3">Product Service form</h3>
        }
      </div>
      <div className="shadow-[inset_0_3px_10px_rgba(0,0,0,0.1)] shadow-black outline max-h-96 overflow-y-auto">
        {queue?.length > 0 ? (
          queue?.map(product => (
            <ProductServiceCard
              key={product._id}
              id={id}
              product={product}
              currentUser={currentUser}
              onSubmitted={handleSubmitted}
            />
          ))
        ) : (
          <div className='p-5 space-y-2'>
            {dates?.date ? (
              <p className='text-center text-gray-700 font-medium'>
                Next Service Due Date: <span className="font-semibold">{new Date(dates.date).toISOString().split("T")[0]}</span>
              </p>
            ) : (
              <p className="text-center text-gray-500">All products serviced ✅</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductServiceForm

function ProductServiceCard({ product, currentUser, onSubmitted, id }) {
  const dispatch = useDispatch()
  const { isModalOpen } = useSelector(store => store.helper)
  const pid = product._id
  const [upload] = useImgUploaderMutation()
  const { handleSubmit, register, setValue, formState: { isSubmitting, isSubmitSuccessful } } = useForm({
    defaultValues: {
      quality: { status: 'ok', image: '' },
      calibration: (product.calibrations || []).map(cal => ({ status: 'ok', image: '' })),
    },
  })

  const [uploadingField, setUploadingField] = React.useState(null)
  const [uploadedFields, setUploadedFields] = React.useState({})

  const [addProducts, { isLoading: prodLoading }] = useAddProductServiceMutation();

  // ── Bait / GlueBoard are mutually exclusive for Rodein ──
  const isRodent = product.productName === "Rodein"
  const hasBait = product.calibrations?.includes('Bait')
  const hasGlue = product.calibrations?.includes('GlueBoard')
  const hasRodentChoice = isRodent && hasBait && hasGlue

  const [rodentMethod, setRodentMethod] = React.useState(null) // 'Bait' | 'GlueBoard' | null
  const [rodentError, setRodentError] = React.useState('')

  const handleImageChange = (path) => async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    setUploadingField(path)
    setUploadedFields(prev => ({ ...prev, [path]: false }))

    try {
      const res = await upload(formData).unwrap()

      setValue(path, res.url)
      setUploadedFields(prev => ({ ...prev, [path]: true }))
    } catch (error) {
      console.error('error', error)
    } finally {
      setUploadingField(null)
    }
  }

  const submit = async (data) => {
    if (hasRodentChoice && !rodentMethod) {
      setRodentError('Please select whether Bait or GlueBoard was used')
      return
    }
    setRodentError('')

    const payload = {
      locationId: id,
      quality: {
        status: data.quality?.status || 'ok',
        image: data.quality?.image || '',
      },
      product: {
        name: product.productName,
        id: product.productId,
      },
      version: {
        name: product.versionName,
        id: product.versionId,
      },
      code: product.code,
      serialNo: product.serialNo,
      calibration: (product.calibrations || []).map((cal, i) => {

        if (hasRodentChoice && (cal === 'Bait' || cal === 'GlueBoard') && cal !== rodentMethod) {
          return { name: cal, status: 'N/A', image: '' }
        }
        return {
          name: cal,
          status: data.calibration?.[i]?.status || 'ok',
          image: data.calibration?.[i]?.image || '',
        }
      }),
    }
    try {
      const res = await addProducts(payload).unwrap()
      onSubmitted(pid)
      console.log(res)
      socket.emit("services", { ...res, url: `/location/${id}` })
      toast.success(res.msg || "Product service successfull")
    } catch (error) {
      console.error('error saving product service', error)
      toast.error(error.msg || "Product service error, try again")
    }
  }


  return (
    <form onSubmit={handleSubmit(submit)} className="bg-white p-1 pb-4 border-b w-full overflow-hidden">
      <div
        className='bg-gray-300 px-2 w-fit outline rounded whitespace-nowrap cursor-pointer'
        onClick={() => { dispatch(toggleModal({ name: `${product._id}-prevRecords`, status: true })) }}
      >
        show previous records
      </div>

      <div
        className={`
      fixed bg-black/30 z-50 inset-0 content-center h-full overflow-y-auto
      transform transition-transform duration-300 ease-in-out
      ${isModalOpen?.[`${product._id}-prevRecords`]
            ? "opacity-100 block"
            : "opacity-0 hidden pointer-events-none"
          }
    `}
      >
        <div className='flex flex-col'>
          <button
            onClick={() =>
              dispatch(toggleModal({ name: `${product._id}-prevRecords`, status: false }))
            }
            className="px-2 mr-3 my-2 py-1 rounded ml-auto bg-red-500 text-white"
          >
            ✕
          </button>

          <PreviousServices
            product={product}
            dispatch={dispatch}
            isModalOpen={isModalOpen}
            toggleModal={toggleModal}
          />
        </div>
      </div>

      <div className="grid grid-cols-3">
        <p><strong>Product Name:</strong> <span>{product.productName}</span></p>
        <p><strong>Serial No:</strong> <span>{product.serialNo}</span></p>
        <p><strong>Frequency:</strong> <span>{product.frequency}</span></p>
        <p><strong>Code:</strong> <span>{product.code}</span></p>
        <p><strong>Version:</strong> <span>{product.versionName}</span></p>
        <p><strong>Specification:</strong> <span>{product.specification}</span></p>
      </div>

      <div className='outline rounded p-2 mt-2'>
        <h3 className="text-lg font-semibold mb-2">1. Equipment Quality</h3>
        <div className="flex flex-col md:flex-row md:justify-evenly ml-3 gap-3 md:items-center ">
          <InputRadio
            register={register}
            name="quality.status"
            id={`${pid}-quality-ok`}
            value="ok"
            label="Ok"
            block={false}
          />
          <InputRadio
            register={register}
            name="quality.status"
            id={`${pid}-quality-repair`}
            value="repair"
            label="Need Repair"
            block={false}
          />
          <InputRadio
            register={register}
            name="quality.status"
            id={`${pid}-quality-replace`}
            value="replace"
            label="Need Replacement"
            block={false}
          />

          <ImageUpload
            name={`${pid}-quality-image`}
            id={`${pid}-quality-image`}
            required={true}
            onchange={handleImageChange('quality.image')}
            isUploading={uploadingField === 'quality.image'}
            isUploaded={!!uploadedFields['quality.image']}
          />
        </div>
      </div>

      <div>
        {hasRodentChoice && (
          <div className="mb-4 p-3 border-2 border-amber-300 rounded bg-amber-50 ">
            <h3 className="text-lg font-semibold mb-2">Method Used</h3>
            <div className="flex gap-6 ml-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${pid}-rodent-method`}
                  checked={rodentMethod === 'Bait'}
                  onChange={() => { setRodentMethod('Bait'); setRodentError('') }}
                />
                Bait
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${pid}-rodent-method`}
                  checked={rodentMethod === 'GlueBoard'}
                  onChange={() => { setRodentMethod('GlueBoard'); setRodentError('') }}
                />
                GlueBoard
              </label>
            </div>
            {rodentError && <p className="text-red-500 text-sm mt-1">{rodentError}</p>}
          </div>
        )}

        {product?.calibrations?.map((cal, i) => {
          const fallbackValue = productCalibrationMapping[cal] || 'Need Repair/Replace'
          const isBaitOrGlue = hasRodentChoice && (cal === 'Bait' || cal === 'GlueBoard')

          // hide bait/glueboard detail fields until a method is chosen,
          // and once chosen, hide the one that wasn't
          if (isBaitOrGlue && cal !== rodentMethod) return null

          return (
            <div key={`${pid}-${cal}-${i}`} className="my-2 p-3 rounded  outline">
              <h3 className="text-lg font-semibold capitalize mb-1">{cal}</h3>
              <div className="flex flex-col ml-5 md:flex-row md:justify-evenly gap-4 md:items-center ">
                <InputRadio
                  register={register}
                  name={`calibration.${i}.status`}
                  id={`${pid}-${cal}-ok`}
                  value="ok"
                  label="Ok"
                  block={false}
                />
                <InputRadio
                  register={register}
                  name={`calibration.${i}.status`}
                  id={`${pid}-${cal}-action`}
                  value={fallbackValue}
                  label={fallbackValue}
                  block={false}
                />
                <ImageUpload
                  name={`${pid}-${cal}-image`}
                  id={`${pid}-${cal}-image`}
                  onchange={handleImageChange(`calibration.${i}.image`)}
                  isUploading={uploadingField === `calibration.${i}.image`}
                  isUploaded={!!uploadedFields[`calibration.${i}.image`]}
                />
              </div>
            </div>
          )
        })}
      </div>


      <div className="mt-4 flex justify-end items-center gap-3">
        {isSubmitSuccessful && <span className="text-green-600 text-sm">Saved ✓</span>}
        <Button type="submit" disabled={isSubmitting} label={isSubmitting ? 'Submitting...' : 'Submit'} />
      </div>
    </form>
  )
}

function ImageUpload({ name, id, onchange, isUploading, isUploaded, required = false }) {
  return (
    <div className="flex flex-col">
      <input
        type="file"
        name={name}
        accept="image/*"
        id={id}
        required={required}
        onChange={onchange}
        disabled={isUploading}
        className="text-sm file:bg-gray-400 w-fit file:px-3 file:py-1 outline"
      />
      <label htmlFor={id}>
        {isUploading ? 'Uploading...' : isUploaded ? 'Uploaded ✅' : 'Upload Image ☑️'}
      </label>
    </div>
  )
}


function PreviousServices({ product, dispatch, isModalOpen, toggleModal }) {
  const { id } = useParams();
  const { data } = useSingleLocationDetailsQuery(id);

  const sorted =
    data?.productsService?.filter(pr => pr.code === product.code) || [];

  return (
    <div className="bg-white border shadow-lg">


      {sorted.length ? (
        <ExpandedProductLists
          maxh="max-h-72"
          w="w-full"
          dispatch={dispatch}
          isModalOpen={isModalOpen}
          toggleModal={toggleModal}
          productData={sorted}
        />
      ) : (
        <p className='p-5 text-2xl font-semibold text-center'>No Previous service record found.</p>
      )}
    </div>
  );
}