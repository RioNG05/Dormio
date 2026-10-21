'use client'

import React from 'react'
import {
  AlertCircle,
  Eye,
  Home,
  IdCard,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  UploadCloud,
  User,
  X,
} from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, DateInput, SelectInput, TextInput } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'
import { ContractWizardFooter } from './ContractWizardFooter'

export function Step1RoomTenant() {
  const t = useTranslations('landlord')
  const {
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    selectedRoomObj,
    isCheckingDeposit,
    flowType,
    pendingDeposit,
    tenantPhone,
    handlePhoneChange,
    isSearchingPhone,
    handleSearchPhone,
    tenantFound,
    tenantFullName,
    setTenantFullName,
    tenantEmail,
    setTenantEmail,
    hasIdentification,
    canEditTenantInfo,
    identification,
    setIdentificationField,
    uploadingFront,
    uploadingBack,
    isDraggingFront,
    setIsDraggingFront,
    isDraggingBack,
    setIsDraggingBack,
    handlePhotoUpload,
    handleDropFile,
    setCardFrontUrl,
    setCardBackUrl,
    setPreviewModalImg,
    errorMessage,
    setErrorMessage,
  } = useContractCreate()

  const {
    identityNumber,
    fullName: idFullName,
    dateOfBirth,
    gender,
    nationality,
    placeOfOrigin,
    placeOfResidence,
    issueDate,
    expiryDate,
    note: idNote,
    cardFrontUrl,
    cardBackUrl,
  } = identification

  return (
    <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
      {/* Room Selection */}
      <div className="space-y-3 border-b border-line pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            {t('landlordContractsCreateRoomSelectLabel')}
          </h2>
          {isCheckingDeposit && (
            <span className="flex items-center gap-1.5 text-xs text-primary font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t('landlordContractsCreateTenantSearching')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectInput
            label={t('landlordContractsCreateRoomSelectLabel')}
            required
            value={selectedRoomId}
            onChange={e => setSelectedRoomId(e.target.value)}
          >
            <option value="">{t('landlordContractsCreateRoomPlaceholder')}</option>
            {rooms.map(r => {
              const roomLabel = `${t('landlordContractDetailRoomPrefix')} ${r.roomNumber} (${r.roomType?.name || 'Standard'} - ${r.status})`
              return (
                <option key={r.id} value={r.id} label={roomLabel}>
                  {roomLabel}
                </option>
              )
            })}
          </SelectInput>

          {selectedRoomObj && (
            <div className="p-3 bg-surface border border-line rounded-xl flex items-center justify-between text-xs font-bold">
              <div>
                <span className="text-muted block text-[11px]">
                  {t('landlordContractDetailRoomPrefix')}:
                </span>
                <span className="text-foreground font-extrabold text-sm">
                  {t('landlordContractDetailRoomPrefix')} {selectedRoomObj.roomNumber}
                </span>
                <span className="text-muted ml-1 text-xs">
                  ({t('landlordRoomDetailFloor')} {selectedRoomObj.floor},{' '}
                  {selectedRoomObj.area || 20}m²)
                </span>
              </div>
              <span
                className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${selectedRoomObj.status === 'deposited'
                    ? 'bg-deposit-soft text-deposit'
                    : 'bg-success-soft text-success'
                  }`}
              >
                {selectedRoomObj.status}
              </span>
            </div>
          )}
        </div>

        {/* FLOW A BANNER IF PENDING PLATFORM DEPOSIT DETECTED */}
        {flowType === 'platform' && pendingDeposit && (
          <div className="p-4 bg-deposit-soft border border-deposit-subtle rounded-2xl space-y-2 mt-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-deposit font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-deposit" />
              <span>{t('landlordContractsCreateFlowPlatformBadge')}</span>
            </div>
            <p className="text-xs text-deposit font-medium leading-relaxed">
              {t('landlordContractsCreateFlowPlatformDesc')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-deposit">
              <span>
                {t('landlordContractsCreateTenantNameLabel')}:{' '}
                <strong>
                  {pendingDeposit.tenant?.fullName || t('landlordContractsCreatePlatformGuest')}
                </strong>
              </span>
              <span>&bull;</span>
              <span>
                {t('landlordContractDetailMemberPhoneLabel')}{' '}
                <strong>{pendingDeposit.tenant?.phoneNumber}</strong>
              </span>
              <span>&bull;</span>
              <span>
                {t('landlordContractDetailDeposit')}{' '}
                <strong>{pendingDeposit.amount.toLocaleString('vi-VN')} ₫</strong> (Fixed)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tenant Information Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {t('landlordContractsCreateStep1Header')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone Input with search lookup */}
          <div className="sm:col-span-2">
            <div className="relative max-w-md">
              <TextInput
                label={t('landlordContractsCreateTenantPhoneLabel')}
                required
                type="tel"
                placeholder={t('landlordContractsCreateTenantPhonePlaceholder')}
                disabled={flowType === 'platform'}
                value={tenantPhone}
                onChange={e => handlePhoneChange(e.target.value)}
                className="pr-24"
              />
              {flowType === 'direct' && (
                <Button
                  type="button"
                  disabled={isSearchingPhone || tenantPhone.length !== 10}
                  isLoading={isSearchingPhone}
                  onClick={() => handleSearchPhone(tenantPhone)}
                  size="sm"
                  leftIcon={<Search />}
                  className="absolute right-1.5 bottom-1.5"
                >
                  {t('landlordContractsCreateTenantSearchBtn')}
                </Button>
              )}
            </div>

            {/* Status hints under phone input */}
            {flowType === 'direct' && tenantPhone.length < 10 && tenantFound === null && (
              <p className="text-[11px] text-muted font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t('landlordContractsCreateTenantPhoneLockedHint')}</span>
              </p>
            )}

            {tenantFound === true && (
              <div className="p-3 bg-success-soft border border-success-subtle rounded-xl flex items-start gap-2.5 text-xs text-success mt-2.5 animate-in fade-in">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-success block">
                    {t('landlordContractsCreateTenantFound')}: {tenantFullName}
                  </span>
                  <span className="text-[11px] text-success font-medium block mt-0.5">
                    {t('landlordContractsCreateTenantLockedAccountDesc')}
                  </span>
                </div>
              </div>
            )}

            {tenantFound === false && flowType === 'direct' && (
              <div className="p-3 bg-warning-soft border border-warning-subtle rounded-xl flex items-start gap-2.5 text-xs text-warning mt-2.5 animate-in fade-in">
                <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-warning block">
                    {t('landlordContractsCreateTenantNotFound')}
                  </span>
                  <span className="text-[11px] text-warning font-medium block mt-0.5">
                    {t('landlordContractsCreateTenantNewAccountDesc')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Full Name */}
          <TextInput
            label={t('landlordContractsCreateTenantNameLabel')}
            required={flowType !== 'platform'}
            placeholder={
              !canEditTenantInfo && tenantPhone.length < 10
                ? t('landlordContractsCreateEnterPhoneFirst')
                : t('landlordContractsCreateTenantNamePlaceholder')
            }
            disabled={!canEditTenantInfo}
            value={tenantFullName}
            onChange={e => setTenantFullName(e.target.value)}
          />

          {/* Email */}
          <TextInput
            label={t('landlordContractsCreateTenantEmailLabel')}
            type="email"
            placeholder={
              !canEditTenantInfo && tenantPhone.length < 10
                ? t('landlordContractsCreateEnterPhoneFirst')
                : t('landlordContractsCreateTenantEmailPlaceholder')
            }
            disabled={!canEditTenantInfo}
            value={tenantEmail}
            onChange={e => setTenantEmail(e.target.value)}
          />
        </div>

        {/* Notice when existing user has NO identification on file */}
        {tenantFound === true && !hasIdentification && (
          <div className="p-4 bg-vacant-soft border border-vacant-subtle rounded-2xl flex items-start gap-3 text-xs text-vacant animate-in fade-in">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-vacant block">
                {t('landlordContractsCreateTenantFound')}: {tenantFullName}
              </span>
              <p className="text-[11px] text-vacant font-medium mt-0.5">
                {t('landlordContractsCreateTenantNoIdNotice')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Citizen Identification (CCCD) Section */}
      <div className="p-5 bg-surface/80 border border-line rounded-2xl space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${hasIdentification
                  ? 'bg-success-soft text-success'
                  : canEditTenantInfo
                    ? 'bg-primary-soft text-primary'
                    : 'bg-line text-muted'
                }`}
            >
              <IdCard className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <span>{t('landlordContractsCreateStep2Header')}</span>
              {hasIdentification && (
                <span className="px-2 py-0.5 bg-success-soft text-success rounded-full font-bold text-[10px] normal-case">
                  {t('landlordContractsCreateTenantHasIdBadge')}
                </span>
              )}
            </h4>
          </div>
          {!canEditTenantInfo ? (
            <span className="text-[11px] text-muted font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-muted" />
              {t('landlordContractsCreateReadOnlyLocked')}
            </span>
          ) : (
            <span className="text-[11px] text-success font-bold flex items-center gap-1">
              <Unlock className="w-3 h-3 text-emerald-500" />
              {t('landlordContractsCreateEditable')}
            </span>
          )}
        </div>

        {/* Alert inside CCCD form if missing identification fields */}
        {errorMessage === t('landlordContractsCreateErrIdentification') && (
          <div className="p-3 bg-danger-soft border border-danger-subtle text-danger rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Row 1: Số CCCD, Họ tên trên CCCD, Ngày sinh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <TextInput
            label={t('landlordContractsCreateCccdNumberLabel')}
            required={canEditTenantInfo}
            placeholder={t('landlordContractsCreateCccdNumberPlaceholder') || '001201012345'}
            disabled={!canEditTenantInfo}
            value={identityNumber}
            onChange={e => {
              setIdentificationField('identityNumber', e.target.value)
              if (errorMessage) setErrorMessage(null)
            }}
          />

          <TextInput
            label={t('landlordContractsCreateCccdNameLabel')}
            required={canEditTenantInfo}
            placeholder={
              tenantFullName ||
              t('landlordContractsCreateCccdNamePlaceholder') ||
              'NGUYEN VAN AN'
            }
            disabled={!canEditTenantInfo}
            value={idFullName}
            onChange={e => {
              setIdentificationField('fullName', e.target.value)
              if (errorMessage) setErrorMessage(null)
            }}
          />

          <DateInput
            label={t('landlordContractsCreateCccdDobLabel')}
            required={canEditTenantInfo}
            disabled={!canEditTenantInfo}
            value={dateOfBirth}
            onChange={e => {
              setIdentificationField('dateOfBirth', e.target.value)
              if (errorMessage) setErrorMessage(null)
            }}
          />
        </div>

        {/* Row 2: Giới tính, Quốc tịch, Quê quán */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <SelectInput
            label={t('landlordContractsCreateCccdGenderLabel')}
            required={canEditTenantInfo}
            disabled={!canEditTenantInfo}
            value={gender}
            onChange={e => setIdentificationField('gender', e.target.value as 'male' | 'female')}
          >
            <option value="male">{t('landlordContractsCreateCccdGenderMale')}</option>
            <option value="female">{t('landlordContractsCreateCccdGenderFemale')}</option>
          </SelectInput>

          <TextInput
            label={t('landlordContractsCreateCccdNationalityLabel')}
            disabled={!canEditTenantInfo}
            value={nationality}
            onChange={e => setIdentificationField('nationality', e.target.value)}
          />

          <TextInput
            label={t('landlordContractsCreateCccdOriginLabel')}
            required={canEditTenantInfo}
            placeholder={t('landlordContractsCreateCccdOriginPlaceholder')}
            disabled={!canEditTenantInfo}
            value={placeOfOrigin}
            onChange={e => {
              setIdentificationField('placeOfOrigin', e.target.value)
              if (errorMessage) setErrorMessage(null)
            }}
          />
        </div>

        {/* Row 3: Nơi thường trú, Ngày cấp, Ngày hết hạn */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <TextInput
            label={t('landlordContractsCreateCccdResidenceLabel')}
            required={canEditTenantInfo}
            placeholder={t('landlordContractsCreateCccdResidencePlaceholder')}
            disabled={!canEditTenantInfo}
            value={placeOfResidence}
            onChange={e => {
              setIdentificationField('placeOfResidence', e.target.value)
              if (errorMessage) setErrorMessage(null)
            }}
          />

          <DateInput
            label={t('landlordContractsCreateCccdIssueDateLabel')}
            disabled={!canEditTenantInfo}
            value={issueDate}
            onChange={e => setIdentificationField('issueDate', e.target.value)}
          />

          <DateInput
            label={t('landlordContractsCreateCccdExpiryDateLabel')}
            disabled={!canEditTenantInfo}
            value={expiryDate}
            onChange={e => setIdentificationField('expiryDate', e.target.value)}
          />
        </div>

        {/* Row 4: Đặc điểm nhận dạng / Ghi chú */}
        <TextInput
          label={t('landlordContractsCreateCccdNoteLabel')}
          placeholder={t('landlordContractsCreateCccdNotePlaceholder')}
          disabled={!canEditTenantInfo}
          value={idNote}
          onChange={e => setIdentificationField('note', e.target.value)}
        />

        {/* Row 5: Ảnh mặt trước & mặt sau CCCD (Tải ảnh trực tiếp) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Mặt trước CCCD */}
          <div>
            <TextInput
              id="cccd-front-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              containerClassName="hidden"
              className="hidden"
              disabled={!canEditTenantInfo}
              onChange={e => handlePhotoUpload(e, 'front')}
            />
            <div className="text-[11px] font-bold text-foreground/90 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-primary" />
                {t('landlordContractsCreateCccdFrontUrlLabel')}
              </span>
              {cardFrontUrl && (
                <span className="text-[10px] text-success font-bold bg-success-soft px-2 py-0.5 rounded-full">
                  {t('landlordContractsCreatePhotoUploaded')}
                </span>
              )}
            </div>

            {cardFrontUrl ? (
              <div className="rounded-xl border border-line bg-surface p-2 space-y-2">
                <div className="relative h-36 w-full rounded-lg overflow-hidden bg-zinc-900/5 flex items-center justify-center border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardFrontUrl}
                    alt={t('landlordContractsCreateCccdFrontUrlLabel')}
                    className="w-full h-full object-cover"
                  />
                  {uploadingFront && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-[11px] font-bold mt-1.5">
                        {t('landlordContractsCreatePhotoProcessing')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPreviewModalImg({
                        url: cardFrontUrl,
                        title: t('landlordContractsCreateCccdFrontUrlLabel'),
                      })
                    }
                    leftIcon={<Eye />}
                  >
                    {t('landlordContractsCreateCccdViewPhoto')}
                  </Button>

                  {canEditTenantInfo ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingFront}
                        onClick={() => document.getElementById('cccd-front-file')?.click()}
                        leftIcon={<RefreshCw />}
                      >
                        {t('landlordContractsCreateCccdChangePhoto')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingFront}
                        onClick={() => setCardFrontUrl('')}
                        title={t('landlordContractsCreateCccdRemovePhoto')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] text-muted font-medium">
                      <Lock className="w-3 h-3" />
                      <span>{t('landlordContractsCreatePhotoLocked')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : !canEditTenantInfo ? (
              <div className="h-36 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card-hover/70 p-4 text-center cursor-not-allowed select-none">
                <Lock className="w-6 h-6 text-muted mb-1.5" />
                <span className="text-xs font-bold text-muted">
                  {tenantPhone.trim().length < 10
                    ? t('landlordContractsCreateEnterPhoneToUnlock')
                    : t('landlordContractsCreateNoFrontPhoto')}
                </span>
                <span className="text-[10px] text-muted mt-0.5">
                  {tenantPhone.trim().length < 10
                    ? t('landlordContractsCreateVerifyPhoneFirst')
                    : t('landlordContractsCreateAccountExists')}
                </span>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => document.getElementById('cccd-front-file')?.click()}
                onDragOver={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDraggingFront(true)
                }}
                onDragLeave={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDraggingFront(false)
                }}
                onDrop={e => handleDropFile(e, 'front')}
                className={`h-36 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${isDraggingFront
                    ? 'border-primary bg-primary-soft scale-[0.99]'
                    : 'border-line bg-surface/70 hover:border-primary/70 hover:bg-card-hover'
                  }`}
              >
                {uploadingFront ? (
                  <div className="flex flex-col items-center justify-center text-primary">
                    <Loader2 className="w-7 h-7 animate-spin mb-1.5" />
                    <span className="text-xs font-bold">
                      {t('landlordContractsCreatePhotoUploading')}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-1.5 shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {t('landlordContractsCreateCccdUploadPrompt')}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {t('landlordContractsCreateCccdUploadHint')}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mặt sau CCCD */}
          <div>
            <TextInput
              id="cccd-back-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              containerClassName="hidden"
              className="hidden"
              disabled={!canEditTenantInfo}
              onChange={e => handlePhotoUpload(e, 'back')}
            />
            <div className="text-[11px] font-bold text-foreground/90 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-primary" />
                {t('landlordContractsCreateCccdBackUrlLabel')}
              </span>
              {cardBackUrl && (
                <span className="text-[10px] text-success font-bold bg-success-soft px-2 py-0.5 rounded-full">
                  {t('landlordContractsCreatePhotoUploaded')}
                </span>
              )}
            </div>

            {cardBackUrl ? (
              <div className="rounded-xl border border-line bg-surface p-2 space-y-2">
                <div className="relative h-36 w-full rounded-lg overflow-hidden bg-zinc-900/5 flex items-center justify-center border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardBackUrl}
                    alt={t('landlordContractsCreateCccdBackUrlLabel')}
                    className="w-full h-full object-cover"
                  />
                  {uploadingBack && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-[11px] font-bold mt-1.5">
                        {t('landlordContractsCreatePhotoProcessing')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPreviewModalImg({
                        url: cardBackUrl,
                        title: t('landlordContractsCreateCccdBackUrlLabel'),
                      })
                    }
                    leftIcon={<Eye />}
                  >
                    {t('landlordContractsCreateCccdViewPhoto')}
                  </Button>

                  {canEditTenantInfo ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingBack}
                        onClick={() => document.getElementById('cccd-back-file')?.click()}
                        leftIcon={<RefreshCw />}
                      >
                        {t('landlordContractsCreateCccdChangePhoto')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingBack}
                        onClick={() => setCardBackUrl('')}
                        title={t('landlordContractsCreateCccdRemovePhoto')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] text-muted font-medium">
                      <Lock className="w-3 h-3" />
                      <span>{t('landlordContractsCreatePhotoLocked')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : !canEditTenantInfo ? (
              <div className="h-36 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card-hover/70 p-4 text-center cursor-not-allowed select-none">
                <Lock className="w-6 h-6 text-muted mb-1.5" />
                <span className="text-xs font-bold text-muted">
                  {tenantPhone.trim().length < 10
                    ? t('landlordContractsCreateEnterPhoneToUnlock')
                    : t('landlordContractsCreateNoBackPhoto')}
                </span>
                <span className="text-[10px] text-muted mt-0.5">
                  {tenantPhone.trim().length < 10
                    ? t('landlordContractsCreateVerifyPhoneFirst')
                    : t('landlordContractsCreateAccountExists')}
                </span>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => document.getElementById('cccd-back-file')?.click()}
                onDragOver={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDraggingBack(true)
                }}
                onDragLeave={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDraggingBack(false)
                }}
                onDrop={e => handleDropFile(e, 'back')}
                className={`h-36 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${isDraggingBack
                    ? 'border-primary bg-primary-soft scale-[0.99]'
                    : 'border-line bg-surface/70 hover:border-primary/70 hover:bg-card-hover'
                  }`}
              >
                {uploadingBack ? (
                  <div className="flex flex-col items-center justify-center text-primary">
                    <Loader2 className="w-7 h-7 animate-spin mb-1.5" />
                    <span className="text-xs font-bold">
                      {t('landlordContractsCreatePhotoUploading')}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-1.5 shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {t('landlordContractsCreateCccdUploadBackPrompt')}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {t('landlordContractsCreateCccdUploadHint')}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="flex items-center gap-3 px-2 bg-danger-soft border border-danger-subtle text-danger rounded-2xl text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-danger" />
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setErrorMessage(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Navigation Footer */}
      <ContractWizardFooter />
    </div>
  )
}
