import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Funcionalidade, Permissao } from '../../../core/enums';
import { Banco } from '../../../core/models/banco.model';
import { ImobiliariaComboDTO, UF, UF_OPTIONS } from '../../../core/models/imobiliaria.model';
import {
  CargoProfissional,
  ProfissionalContextoAlteracaoDTO,
  ProfissionalHabilitarAcessoDTO,
  ProfissionalPreCadastroDTO,
  ProfissionalCreateDTO,
  ProfissionalDTO,
  StatusJornadaProfissional,
  TipoChavePixProfissional,
  TipoContaBancariaProfissional,
  TIPO_CHAVE_PIX_PROFISSIONAL_LABELS,
  TIPO_CONTA_BANCARIA_PROFISSIONAL_LABELS
} from '../../../core/models/profissional.model';
import { TipoProfissional, TIPO_PROFISSIONAL_LABELS } from '../../../core/models/reserva.model';
import { ImobiliariaService, PermissaoService, ProfissionalService } from '../../../core/services';
import { BancoService } from '../../../core/services/banco.service';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

interface BancoOption {
  label: string;
  value: string;
  codigo: string;
  nome: string;
  banco: Banco;
}

@Component({
  selector: 'app-profissional-form',
  templateUrl: './profissional-form.component.html',
  styleUrls: ['./profissional-form.component.scss']
})
export class ProfissionalFormComponent extends BaseFormComponent implements OnInit {
  readonly jornadaLabels: Record<StatusJornadaProfissional, string> = {
    [StatusJornadaProfissional.RASCUNHO]: 'Rascunho',
    [StatusJornadaProfissional.COMPLETO_SEM_ACESSO]: 'Completo sem acesso',
    [StatusJornadaProfissional.COMPLETO_COM_ACESSO]: 'Completo com acesso'
  };
  modoEdicao = false;
  profissionalId: number | null = null;
  carregando = false;
  buscandoCpf = false;
  habilitandoAcesso = false;
  exibirModalHabilitarAcesso = false;
  cpfConsultado = '';
  formularioLiberado = false;
  mensagemContextoCpf = '';
  severidadeContextoCpf: 'info' | 'success' | 'warn' = 'info';
  nome = '';
  nomeGuerra = '';
  cpf = '';
  telefone = '';
  email = '';
  numeroCreci = '';
  cargoSelecionado: { label: string; value: CargoProfissional } | null = null;
  orgaoCreci = '';
  estadoIdentidade = '';
  rua = '';
  numero = '';
  complemento = '';
  bairro = '';
  cep = '';
  estado = '';
  cidade = '';
  pais = 'Brasil';
  numeroBanco = '';
  numeroAgencia = '';
  numeroContaCorrente = '';
  digitoConta = '';
  tipoContaSelecionado: { label: string; value: TipoContaBancariaProfissional } | null = null;
  tipoChavePixSelecionado: { label: string; value: TipoChavePixProfissional } | null = null;
  chavePix = '';
  dataExpiracaoAcesso: Date | null = null;
  enviarEmailBoasVindas = true;
  ativo = true;
  profissionalAtual: ProfissionalDTO | null = null;
  imobiliariaIds: number[] = [];
  imobiliariaPrincipalId: number | null = null;
  breadcrumbItems: BreadcrumbItem[] = [];
  imobiliariaOptions: { label: string; value: number }[] = [];
  bancosOptions: BancoOption[] = [];
  bancosSugestoes: BancoOption[] = [];
  ufsOptions = UF_OPTIONS.map(uf => ({
    label: uf,
    value: uf
  }));
  ufsSugestoes = [...this.ufsOptions];
  cargosOptions = Object.values(TipoProfissional).map(tipo => ({
    label: TIPO_PROFISSIONAL_LABELS[tipo],
    value: tipo as CargoProfissional
  }));
  cargosSugestoes = [...this.cargosOptions];
  tiposContaOptions = Object.values(TipoContaBancariaProfissional).map(tipo => ({
    label: TIPO_CONTA_BANCARIA_PROFISSIONAL_LABELS[tipo],
    value: tipo
  }));
  tiposContaSugestoes = [...this.tiposContaOptions];
  tiposChavePixOptions = Object.values(TipoChavePixProfissional).map(tipo => ({
    label: TIPO_CHAVE_PIX_PROFISSIONAL_LABELS[tipo],
    value: tipo
  }));
  tiposChavePixSugestoes = [...this.tiposChavePixOptions];
  private cpfOriginalEdicao = '';

  constructor(
    private profissionalService: ProfissionalService,
    private bancoService: BancoService,
    private imobiliariaService: ImobiliariaService,
    private permissaoService: PermissaoService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.carregarBancos();
    this.carregarImobiliarias();
    this.route.paramMap.subscribe(() => {
      this.aplicarContextoRota();
    });
  }

  salvar(): void {
    if (this.buscandoCpf) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Consulta em andamento',
        detail: 'Aguarde a validacao do CPF antes de salvar o cadastro.'
      });
      return;
    }

    if (!this.validarFormulario()) {
      return;
    }

    if ((this.tipoChavePixSelecionado && !this.chavePix.trim()) || (!this.tipoChavePixSelecionado && this.chavePix.trim())) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Dados PIX incompletos',
        detail: 'Tipo de chave PIX e chave PIX devem ser informados juntos.'
      });
      return;
    }

    if (this.cpf && !this.validarCPF(this.cpf)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'CPF inválido',
        detail: 'Informe um CPF válido ou deixe o campo em branco.'
      });
      this.focarCampo('cpfProfissional');
      return;
    }

    if (this.numeroBanco && !this.isBancoSelecionadoValido()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Banco invalido',
        detail: 'Selecione um banco valido da lista para continuar.'
      });
      this.focarCampo('numeroBancoProfissional');
      return;
    }

    this.salvando = true;
    const payload = this.montarPayload();
    const requisicao = this.modoEdicao && this.profissionalId
      ? this.profissionalService.atualizar(this.profissionalId, payload)
      : this.profissionalService.cadastrar(payload);

    requisicao.subscribe({
      next: (profissional) => {
        this.salvando = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Profissional "${profissional.nome}" ${this.modoEdicao ? 'atualizado' : 'criado'} com sucesso`
        });
        this.router.navigate(['/cadastros/profissionais']);
      },
      error: (error) => {
        this.salvando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || `Erro ao ${this.modoEdicao ? 'atualizar' : 'criar'} profissional`
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/cadastros/profissionais']);
  }

  limpar(): void {
    this.limparContextoCpf();
    this.nome = '';
    this.nomeGuerra = '';
    this.cpf = '';
    this.telefone = '';
    this.email = '';
    this.numeroCreci = '';
    this.cargoSelecionado = null;
    this.orgaoCreci = '';
    this.estadoIdentidade = '';
    this.rua = '';
    this.numero = '';
    this.complemento = '';
    this.bairro = '';
    this.cep = '';
    this.estado = '';
    this.cidade = '';
    this.pais = 'Brasil';
    this.numeroBanco = '';
    this.numeroAgencia = '';
    this.numeroContaCorrente = '';
    this.digitoConta = '';
    this.tipoContaSelecionado = null;
    this.tipoChavePixSelecionado = null;
    this.chavePix = '';
    this.ativo = true;
    this.imobiliariaIds = [];
    this.imobiliariaPrincipalId = null;
    this.tentouSalvar = false;
  }

  onCpfChange(): void {
    const cpfDigits = this.normalizarTexto(this.cpf, true) || '';

    if (!cpfDigits || cpfDigits.length < 11) {
      this.cpfConsultado = '';

      if (this.modoEdicao) {
        this.formularioLiberado = true;
        this.mensagemContextoCpf = cpfDigits
          ? 'Conclua os 11 digitos do CPF para validar a continuidade da edicao.'
          : '';
        this.severidadeContextoCpf = cpfDigits ? 'warn' : 'info';
        return;
      }

      this.limparContextoCpf();
      return;
    }

    if (cpfDigits.length !== 11 || cpfDigits === this.cpfConsultado) {
      return;
    }

    if (!this.validarCPF(cpfDigits)) {
      this.cpfConsultado = cpfDigits;
      this.limparContextoCpf();
      this.mensagemContextoCpf = 'CPF invalido. Verifique o numero informado.';
      this.severidadeContextoCpf = 'warn';
      return;
    }

    this.cpfConsultado = cpfDigits;
    this.consultarCpf(cpfDigits);
  }

  filtrarCargos(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();
    this.cargosSugestoes = !query
      ? [...this.cargosOptions]
      : this.cargosOptions.filter(item => item.label.toLowerCase().includes(query));
  }

  mostrarTodosCargos(): void {
    this.cargosSugestoes = [...this.cargosOptions];
  }

  filtrarBancos(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();

    this.bancosSugestoes = !query
      ? [...this.bancosOptions]
      : this.bancosOptions.filter(item =>
          item.codigo.toLowerCase().includes(query) ||
          item.nome.toLowerCase().includes(query) ||
          item.label.toLowerCase().includes(query)
        );
  }

  mostrarTodosBancos(): void {
    this.bancosSugestoes = [...this.bancosOptions];
  }

  filtrarUfs(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();
    this.ufsSugestoes = !query
      ? [...this.ufsOptions]
      : this.ufsOptions.filter(item => item.label.toLowerCase().includes(query));
  }

  mostrarTodasUfs(): void {
    this.ufsSugestoes = [...this.ufsOptions];
  }

  filtrarTiposConta(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();
    this.tiposContaSugestoes = !query
      ? [...this.tiposContaOptions]
      : this.tiposContaOptions.filter(item => item.label.toLowerCase().includes(query));
  }

  mostrarTodosTiposConta(): void {
    this.tiposContaSugestoes = [...this.tiposContaOptions];
  }

  filtrarTiposChavePix(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();
    this.tiposChavePixSugestoes = !query
      ? [...this.tiposChavePixOptions]
      : this.tiposChavePixOptions.filter(item => item.label.toLowerCase().includes(query));
  }

  mostrarTodosTiposChavePix(): void {
    this.tiposChavePixSugestoes = [...this.tiposChavePixOptions];
  }

  onTipoChavePixChange(valor: { label: string; value: TipoChavePixProfissional } | null): void {
    if (!valor) {
      this.chavePix = '';
    }
  }

  abrirModalHabilitarAcesso(): void {
    if (!this.podeHabilitarAcesso) {
      return;
    }

    this.dataExpiracaoAcesso = null;
    this.enviarEmailBoasVindas = true;
    this.exibirModalHabilitarAcesso = true;
  }

  fecharModalHabilitarAcesso(): void {
    if (this.habilitandoAcesso) {
      return;
    }

    this.exibirModalHabilitarAcesso = false;
  }

  habilitarAcesso(): void {
    if (!this.profissionalId) {
      return;
    }

    const email = this.normalizarTexto(this.email);
    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'E-mail obrigatório',
        detail: 'Informe o e-mail do profissional antes de habilitar o acesso.'
      });
      this.focarCampo('emailProfissional');
      return;
    }

    const payload: ProfissionalHabilitarAcessoDTO = {
      email,
      dataExpiracao: this.dataExpiracaoAcesso ? this.formatarDataParaAPI(this.dataExpiracaoAcesso) : null,
      enviarEmailBoasVindas: this.enviarEmailBoasVindas
    };

    this.habilitandoAcesso = true;
    this.profissionalService.habilitarAcesso(this.profissionalId, payload).subscribe({
      next: (profissional) => {
        this.habilitandoAcesso = false;
        this.exibirModalHabilitarAcesso = false;
        this.preencherFormulario(profissional);
        this.messageService.add({
          severity: 'success',
          summary: 'Acesso habilitado',
          detail: 'O acesso do profissional foi habilitado com sucesso.'
        });
      },
      error: (error) => {
        this.habilitandoAcesso = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao habilitar acesso do profissional'
        });
      }
    });
  }

  get podeHabilitarAcesso(): boolean {
    return !!this.profissionalAtual?.jornada?.cadastroCompleto && !!this.profissionalAtual?.jornada?.permiteHabilitarAcesso;
  }

  get jornadaStatusLabel(): string {
    const status = this.profissionalAtual?.jornada?.status;
    return status ? this.jornadaLabels[status] : 'Nao informado';
  }

  get jornadaStatusSeverity(): 'success' | 'warning' | 'info' {
    switch (this.profissionalAtual?.jornada?.status) {
      case StatusJornadaProfissional.COMPLETO_COM_ACESSO:
        return 'success';
      case StatusJornadaProfissional.COMPLETO_SEM_ACESSO:
        return 'warning';
      default:
        return 'info';
    }
  }

  get acessoSistemaLabel(): string {
    return this.profissionalAtual?.acesso?.possuiAcessoSistema ? 'Com acesso ao sistema' : 'Sem acesso ao sistema';
  }

  get acessoSistemaSeverity(): 'success' | 'contrast' {
    return this.profissionalAtual?.acesso?.possuiAcessoSistema ? 'success' : 'contrast';
  }

  get mostrarMensagemContextoCpf(): boolean {
    return !this.modoEdicao && (!!this.mensagemContextoCpf || this.buscandoCpf);
  }

  get exibirCamposFormulario(): boolean {
    return this.modoEdicao || this.formularioLiberado;
  }

  get cpfPodeSerEditado(): boolean {
    return !this.modoEdicao || !this.profissionalAtual?.acesso?.possuiAcessoSistema;
  }

  protected getCamposObrigatorios(): Array<{ id: string; valor: any; label?: string }> {
    return [
      { id: 'nomeProfissional', valor: this.nome, label: 'Nome' },
      { id: 'telefoneProfissional', valor: this.telefone, label: 'Telefone' }
    ];
  }

  protected override exibirMensagemCampoObrigatorio(campo: { id: string; valor: any; label?: string }): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Campos obrigatórios',
      detail: `O campo "${campo.label || campo.id}" é obrigatório.`
    });
  }

  private verificarModo(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.modoEdicao = false;
    this.profissionalId = null;

    if (id) {
      this.modoEdicao = true;
      this.profissionalId = Number(id);
    }
  }

  private aplicarContextoRota(): void {
    this.verificarModo();

    if (!this.temPermissao(this.modoEdicao ? Permissao.ALTERAR : Permissao.INCLUIR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    this.configurarBreadcrumb();

    if (this.modoEdicao) {
      this.formularioLiberado = true;
      this.profissionalAtual = null;
      this.carregarProfissional();
      return;
    }

    this.profissionalAtual = null;
    this.aplicarEstadoInicialCadastro();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Profissionais', url: '/cadastros/profissionais' },
      { label: this.modoEdicao ? 'Editar Profissional' : 'Novo Profissional' }
    ];
  }

  private carregarImobiliarias(): void {
    this.imobiliariaService.listarCombo().subscribe({
      next: (imobiliarias: ImobiliariaComboDTO[]) => {
        this.imobiliariaOptions = imobiliarias
          .filter(imobiliaria => imobiliaria.ativo)
          .map(imobiliaria => ({
            label: imobiliaria.nomeFantasia,
            value: imobiliaria.id
          }));
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Não foi possível carregar as imobiliárias'
        });
      }
    });
  }

  private carregarBancos(): void {
    this.bancoService.listarTodos().subscribe({
      next: (bancos: Banco[]) => {
        this.bancosOptions = bancos.map(banco => ({
          label: `${banco.codigo} - ${banco.nome}`,
          value: banco.codigo,
          codigo: banco.codigo,
          nome: banco.nome,
          banco
        }));
        this.bancosSugestoes = [...this.bancosOptions];
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Nao foi possivel carregar o catalogo de bancos.'
        });
      }
    });
  }

  private carregarProfissional(): void {
    if (!this.profissionalId) {
      return;
    }

    this.carregando = true;
    this.profissionalService.buscarPorId(this.profissionalId).subscribe({
      next: (profissional) => {
        this.preencherFormulario(profissional);
        this.carregando = false;
      },
      error: (error) => {
        this.carregando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao carregar profissional'
        });
        this.router.navigate(['/cadastros/profissionais']);
      }
    });
  }

  private preencherFormulario(profissional: ProfissionalDTO): void {
    this.limparContextoCpf();
    this.formularioLiberado = true;
    this.profissionalAtual = profissional;
    this.cpfOriginalEdicao = (profissional.cpf || '').replace(/\D/g, '');
    this.nome = profissional.nome || '';
    this.nomeGuerra = profissional.nomeGuerra || '';
    this.cpf = profissional.cpf || '';
    this.telefone = profissional.telefone || '';
    this.email = profissional.email || '';
    this.numeroCreci = profissional.numeroCreci || '';
    this.cargoSelecionado = profissional.cargo
      ? this.cargosOptions.find(item => item.value === profissional.cargo) || null
      : null;
    this.orgaoCreci = profissional.orgaoCreci || '';
    this.estadoIdentidade = profissional.estadoIdentidade || '';
    this.rua = profissional.rua || '';
    this.numero = profissional.numero || '';
    this.complemento = profissional.complemento || '';
    this.bairro = profissional.bairro || '';
    this.cep = profissional.cep || '';
    this.estado = profissional.estado || '';
    this.cidade = profissional.cidade || '';
    this.pais = profissional.pais || 'Brasil';
    this.numeroBanco = profissional.numeroBanco || '';
    this.numeroAgencia = profissional.numeroAgencia || '';
    this.numeroContaCorrente = profissional.numeroContaCorrente || '';
    this.digitoConta = profissional.digitoConta || '';
    this.tipoContaSelecionado = profissional.tipoConta
      ? this.tiposContaOptions.find(item => item.value === profissional.tipoConta) || null
      : null;
    this.tipoChavePixSelecionado = profissional.tipoChavePix
      ? this.tiposChavePixOptions.find(item => item.value === profissional.tipoChavePix) || null
      : null;
    this.chavePix = profissional.chavePix || '';
    this.ativo = profissional.ativo;
    this.imobiliariaIds = (profissional.imobiliarias || []).map(item => item.imobiliariaId);
    this.imobiliariaPrincipalId = (profissional.imobiliarias || []).find(item => item.principal)?.imobiliariaId || null;
    this.cpfConsultado = (profissional.cpf || '').replace(/\D/g, '');
  }

  private consultarCpf(cpfDigits: string): void {
    this.buscandoCpf = true;
    this.formularioLiberado = this.modoEdicao;
    this.mensagemContextoCpf = 'Consultando cadastros existentes para este CPF...';
    this.severidadeContextoCpf = 'info';

    if (this.modoEdicao && this.profissionalId) {
      this.profissionalService.buscarContextoAlteracaoPorCpf(this.profissionalId, cpfDigits).subscribe({
        next: (response: ProfissionalContextoAlteracaoDTO) => {
          this.buscandoCpf = false;
          this.aplicarContextoAlteracao(response);
        },
        error: (error: any) => {
          this.buscandoCpf = false;
          this.formularioLiberado = true;
          this.mensagemContextoCpf = error.error?.message || 'Nao foi possivel consultar o CPF informado.';
          this.severidadeContextoCpf = 'warn';
        }
      });
      return;
    }

    this.profissionalService.buscarPreCadastroPorCpf(cpfDigits).subscribe({
      next: (response: ProfissionalPreCadastroDTO) => {
        this.buscandoCpf = false;
        this.aplicarPreCadastro(response);
      },
      error: (error: any) => {
        this.buscandoCpf = false;
        this.formularioLiberado = false;
        this.mensagemContextoCpf = error.error?.message || 'Nao foi possivel consultar o CPF informado.';
        this.severidadeContextoCpf = 'warn';
      }
    });
  }

  private aplicarPreCadastro(response: ProfissionalPreCadastroDTO): void {
    if (response.profissionalEncontrado && response.profissional?.id) {
      this.mensagemContextoCpf = response.mensagem;
      this.severidadeContextoCpf = 'info';
      this.messageService.add({
        severity: 'info',
        summary: 'Profissional encontrado',
        detail: response.mensagem
      });
      this.router.navigate(['/cadastros/profissionais', response.profissional.id, 'editar']);
      return;
    }

    this.formularioLiberado = true;
    this.mensagemContextoCpf = response.mensagem;
    this.severidadeContextoCpf = 'info';
  }

  private aplicarContextoAlteracao(response: ProfissionalContextoAlteracaoDTO): void {
    if (response.deveRedirecionarParaAlteracao && response.profissionalDestinoId) {
      this.mensagemContextoCpf = response.mensagem;
      this.severidadeContextoCpf = 'info';
      this.messageService.add({
        severity: 'info',
        summary: 'Profissional encontrado',
        detail: response.mensagem
      });
      this.router.navigate(['/cadastros/profissionais', response.profissionalDestinoId, 'editar']);
      return;
    }

    this.formularioLiberado = true;
    this.mensagemContextoCpf = response.mensagem;
    this.severidadeContextoCpf = response.pertenceAoRegistroAtual ? 'success' : 'info';

    if (!response.pertenceAoRegistroAtual) {
      this.messageService.add({
        severity: 'info',
        summary: 'CPF atualizado',
        detail: 'Nenhum outro cadastro foi encontrado para este CPF. Continue a alteracao do registro atual.'
      });
    }
  }

  private aplicarEstadoInicialCadastro(): void {
    const cpf = this.route.snapshot.queryParamMap.get('cpf');
    const mensagem = this.route.snapshot.queryParamMap.get('mensagem');

    if (!cpf) {
      return;
    }

    this.cpf = cpf;
    this.cpfConsultado = (cpf || '').replace(/\D/g, '');
    this.formularioLiberado = true;
    this.mensagemContextoCpf = mensagem || 'CPF nao encontrado. Continue o preenchimento do novo cadastro.';
    this.severidadeContextoCpf = 'info';
  }

  private montarPayload(): ProfissionalCreateDTO {
    const imobiliariaIds = this.normalizarImobiliariaIds();
    const imobiliariaPrincipalId = this.imobiliariaPrincipalId && imobiliariaIds.includes(this.imobiliariaPrincipalId)
      ? this.imobiliariaPrincipalId
      : null;

    return {
      cpf: this.normalizarTexto(this.cpf, true),
      nome: this.nome.trim(),
      nomeGuerra: this.normalizarTexto(this.nomeGuerra),
      telefone: this.normalizarTexto(this.telefone, true) || '',
      email: this.normalizarTexto(this.email),
      cargo: this.cargoSelecionado?.value || null,
      tipoProfissional: this.cargoSelecionado?.value || null,
      numeroCreci: this.normalizarTexto(this.numeroCreci),
      orgaoCreci: this.normalizarTexto(this.orgaoCreci),
      estadoIdentidade: this.normalizarTexto(this.estadoIdentidade),
      rua: this.normalizarTexto(this.rua),
      numero: this.normalizarTexto(this.numero),
      complemento: this.normalizarTexto(this.complemento),
      bairro: this.normalizarTexto(this.bairro),
      cep: this.normalizarTexto(this.cep),
      estado: this.normalizarTexto(this.estado),
      cidade: this.normalizarTexto(this.cidade),
      pais: this.normalizarTexto(this.pais),
      numeroBanco: this.normalizarTexto(this.numeroBanco),
      numeroAgencia: this.normalizarTexto(this.numeroAgencia),
      numeroContaCorrente: this.normalizarTexto(this.numeroContaCorrente),
      digitoConta: this.normalizarTexto(this.digitoConta),
      tipoConta: this.tipoContaSelecionado?.value || null,
      tipoChavePix: this.tipoChavePixSelecionado?.value || null,
      chavePix: this.normalizarTexto(this.chavePix),
      ativo: this.ativo,
      imobiliariaPrincipalId,
      imobiliariaIds: imobiliariaIds.length ? imobiliariaIds : undefined,
      imobiliarias: imobiliariaIds.length
        ? imobiliariaIds.map(imobiliariaId => ({
            imobiliariaId,
            tipoProfissional: this.cargoSelecionado?.value || null,
            principal: imobiliariaId === imobiliariaPrincipalId
          }))
        : undefined
    };
  }

  private isBancoSelecionadoValido(): boolean {
    return this.bancosOptions.some(item => item.codigo === this.numeroBanco);
  }

  private limparContextoCpf(): void {
    this.buscandoCpf = false;
    this.formularioLiberado = false;
    this.mensagemContextoCpf = '';
    this.severidadeContextoCpf = 'info';
  }

  private normalizarImobiliariaIds(): number[] {
    return Array.from(new Set((this.imobiliariaIds || []).filter(id => !!id)));
  }

  private normalizarTexto(valor: string, somenteDigitos: boolean = false): string | null {
    const texto = (valor || '').trim();

    if (!texto) {
      return null;
    }

    return somenteDigitos ? texto.replace(/\D/g, '') : texto;
  }

  private formatarCpf(cpf: string): string {
    const valor = (cpf || '').replace(/\D/g, '');
    return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private formatarDataParaAPI(data: Date): string {
    const ano = data.getFullYear();
    const mes = `${data.getMonth() + 1}`.padStart(2, '0');
    const dia = `${data.getDate()}`.padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private validarCPF(cpf: string): boolean {
    const valor = (cpf || '').replace(/\D/g, '');

    if (!valor) {
      return true;
    }

    if (valor.length !== 11 || /^([0-9])\1+$/.test(valor)) {
      return false;
    }

    let soma = 0;
    for (let indice = 0; indice < 9; indice += 1) {
      soma += Number(valor.charAt(indice)) * (10 - indice);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10) {
      resto = 0;
    }
    if (resto !== Number(valor.charAt(9))) {
      return false;
    }

    soma = 0;
    for (let indice = 0; indice < 10; indice += 1) {
      soma += Number(valor.charAt(indice)) * (11 - indice);
    }

    resto = (soma * 10) % 11;
    if (resto === 10) {
      resto = 0;
    }

    return resto === Number(valor.charAt(10));
  }

  private temPermissao(permissao: Permissao): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.PROFISSIONAL, permissao);
  }
}