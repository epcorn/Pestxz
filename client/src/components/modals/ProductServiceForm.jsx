import React from 'react'
import { useForm } from 'react-hook-form'
import Button from '../Button'
import { productCalibrationMapping } from '../../utils/constData'
import InputRadio from '../InputRadio'
import { useImgUploaderMutation } from '../../redux/adminSlice'
import { useParams } from 'react-router-dom'
import { useAddProductServiceMutation } from '../../redux/serviceSlice'

function ProductServiceForm({ products, currentUser }) {
  const { id } = useParams()
  const [submittedIds, setSubmittedIds] = React.useState([])

  const queue = products?.filter(p => !submittedIds.includes(p._id)).filter(f => f.schedule.find(sc => new Date(sc.date).toISOString().split("T")[0] === new Date().toISOString().split("T")[0]))

  console.log(products)
  const handleSubmitted = (pid) => {
    setSubmittedIds(prev => [...prev, pid])

  }

  return (
    <div className="bg-slate-300 max-w-3xl border-2 rounded-lg mx-auto p-2 md:p-5">
      <div>
        <h3 className="font-semibold text-2xl mb-3">Product Service form</h3>
      </div>
      <div className="shadow-[inset_0_3px_10px_rgba(0,0,0,0.1)] shadow-black outline max-h-72 overflow-y-auto">
        {queue?.length ? (
          queue.map(product => (
            <ProductServiceCard
              key={product._id}
              id={id}
              product={product}
              currentUser={currentUser}
              onSubmitted={handleSubmitted}
            />
          ))
        ) : (
          <p className="p-4 text-center text-gray-500">All products serviced ✅</p>
        )}
      </div>
    </div>
  )
}

export default ProductServiceForm

function ProductServiceCard({ product, currentUser, onSubmitted, id }) {

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
      calibration: (product.calibrations || []).map((cal, i) => ({
        name: cal,
        status: data.calibration?.[i]?.status || 'ok',
        image: data.calibration?.[i]?.image || '',
      })),
    }

    try {
      // console.log(payload)
      onSubmitted(pid)
      const res = await addProducts(payload).unwrap()
      console.log(res)
    } catch (error) {
      console.error('error saving product service', error)

    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="bg-white p-1 pb-4 border-b">
      <div className="grid grid-cols-3">
        <p><strong>Product Name:</strong> <span>{product.productName}</span></p>
        <p><strong>Serial No:</strong> <span>{product.serialNo}</span></p>
        <p><strong>Frequency:</strong> <span>{product.frequency}</span></p>
        <p><strong>Code:</strong> <span>{product.code}</span></p>
        <p><strong>Version:</strong> <span>{product.versionName}</span></p>
        <p><strong>Specification:</strong> <span>{product.specification}</span></p>
      </div>

      <div>
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
            onchange={handleImageChange('quality.image')}
            isUploading={uploadingField === 'quality.image'}
            isUploaded={!!uploadedFields['quality.image']}
          />
        </div>
      </div>

      <div>
        {product?.calibrations?.map((cal, i) => {
          const fallbackValue = productCalibrationMapping[cal] || 'Need Repair/Replace'

          // const isRodent = product.

          return (
            <div key={`${pid}-${cal}-${i}`} className="mb-4">
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

function ImageUpload({ name, id, onchange, isUploading, isUploaded }) {
  return (
    <div className="flex flex-col">
      <input
        type="file"
        name={name}
        accept="image/*"
        id={id}
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