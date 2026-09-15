/** Mapea el estado de useEditPcStock / useStockPcModals a props de EditPcStockModal. */
export function editPcStockModalProps(source, catalogos) {
  const {
    tiposEquipoItems,
    condicionesItems,
    ubicCompItems,
  } = catalogos;

  return {
    open: source.editPcOpen,
    mode: 'edit',
    pc: source.editPc,
    cargando: source.editPcCargando,
    error: source.editPcError,
    formCpu: source.formCpu,
    onFormCpuChange: source.setFormCpu,
    formRam: source.formRam,
    onFormRamChange: source.setFormRam,
    formDisco: source.formDisco,
    onFormDiscoChange: source.setFormDisco,
    formDescripcion: source.formDescripcion,
    onFormDescripcionChange: source.setFormDescripcion,
    formSpecPreview: source.formSpecPreview,
    formCantidad: '1',
    tipoEquipo: source.formTipoEquipo,
    onTipoEquipoChange: source.setFormTipoEquipo,
    condicion: source.formCondicion,
    onCondicionChange: source.setFormCondicion,
    ubicacionDeposito: source.formUbicacionStock,
    onUbicacionDepositoChange: source.setFormUbicacionStock,
    tiposEquipoItems,
    condicionesItems,
    ubicCompItems,
    yaEnDeposito: source.editPcYaEnDeposito,
    motivoIngreso: source.editPcMotivoIngreso,
    onMotivoIngresoChange: source.setEditPcMotivoIngreso,
    guardando: source.guardandoPcEdit,
    eliminando: source.eliminandoPcEdit,
    ingresando: source.ingresandoPcStock,
    onGuardar: source.handleGuardarEditPc,
    onIngresarStock: source.handleIngresarPcStock,
    onEliminar: source.handleEliminarEditPc,
    onClose: source.closeEditPc,
  };
}

export function nuevaPcStockModalProps(source, catalogos) {
  const {
    tiposEquipoItems,
    condicionesItems,
    ubicCompItems,
  } = catalogos;

  return {
    open: source.nuevaPcOpen,
    mode: 'create',
    hostname: source.nuevaPcHostname,
    onHostnameChange: source.setNuevaPcHostname,
    sistemaOperativo: source.nuevaPcSo,
    onSistemaOperativoChange: source.setNuevaPcSo,
    ubicacionSede: source.nuevaPcUbicacion,
    onUbicacionSedeChange: source.setNuevaPcUbicacion,
    tipoEquipo: source.nuevaPcTipoEquipo,
    onTipoEquipoChange: source.setNuevaPcTipoEquipo,
    condicion: source.nuevaPcCondicion,
    onCondicionChange: source.setNuevaPcCondicion,
    ubicacionDeposito: source.nuevaPcUbicacionStock,
    onUbicacionDepositoChange: source.setNuevaPcUbicacionStock,
    motivo: source.nuevaPcMotivo,
    onMotivoChange: source.setNuevaPcMotivo,
    tiposEquipoItems,
    condicionesItems,
    ubicCompItems,
    guardando: source.creandoPc,
    guardarDisabled: !source.nuevaPcHostname?.trim(),
    onGuardar: source.handleCrearPcStock,
    onClose: () => source.setNuevaPcOpen(false),
  };
}
