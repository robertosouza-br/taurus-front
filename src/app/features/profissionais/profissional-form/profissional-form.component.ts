import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Funcionalidade, Permissao } from '../../../core/enums';
import { ImobiliariaComboDTO } from '../../../core/models/imobiliaria.model';
import { ProfissionalCreateDTO, ProfissionalDTO } from '../../../core/models/profissional.model';
import { TipoProfissional } from '../../../core/models/reserva.model';
import { ImobiliariaService, PermissaoService, ProfissionalService } from '../../../core/services';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-profissional-form',
  templateUrl: './profissional-form.component.html',
  styleUrls: ['./profissional-form.component.scss']
})
export class ProfissionalFormComponent extends BaseFormComponent implements OnInit {
  modoEdicao = false;
  profissionalId: number | null = null;
  carregando = false;
  nome = '';
  nomeGuerra = '';
  cpf = '';
  telefone = '';
  email = '';
  numeroCreci = '';
  tipoProfissional: TipoProfissional | null = null;
  ativo = true;
  imobiliariaIds: number[] = [];
  imobiliariaPrincipalId: number | null = null;
  breadcrumbItems: BreadcrumbItem[] = [];
  imobiliariaOptions: { label: string; value: number }[] = [];
  imobiliariaFiltradas: { label: string; value: number }[] = [];
  imobiliariaPrincipalFiltradas: { label: string; value: number }[] = [];

  constructor(
    private profissionalService: ProfissionalService,
    private imobiliariaService: ImobiliariaService,
    private permissaoService: PermissaoService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.verificarModo();

    if (!this.temPermissao(this.modoEdicao ? Permissao.ALTERAR : Permissao.INCLUIR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    this.configurarBreadcrumb();
    this.carregarImobiliarias();

    if (this.modoEdicao) {
      this.carregarProfissional();
    }
  }

  salvar(): void {
    if (!this.validarFormulario()) {
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
    this.nome = '';
    this.nomeGuerra = '';
    this.cpf = '';
    this.telefone = '';
    this.email = '';
    this.numeroCreci = '';
    this.tipoProfissional = null;
    this.ativo = true;
    this.imobiliariaIds = [];
    this.imobiliariaPrincipalId = null;
    this.tentouSalvar = false;
  }

  onImobiliariasAlteradas(): void {
    const ids = this.normalizarImobiliariaIds();
    this.imobiliariaIds = ids;

    if (this.imobiliariaPrincipalId && !ids.includes(this.imobiliariaPrincipalId)) {
      this.imobiliariaPrincipalId = null;
    }

    if (!this.imobiliariaPrincipalId && ids.length === 1) {
      this.imobiliariaPrincipalId = ids[0];
    }

    this.carregarTodasImobiliariasPrincipais();
  }

  filtrarImobiliarias(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();
    this.imobiliariaFiltradas = !query
      ? [...this.imobiliariaOptions]
      : this.imobiliariaOptions.filter(item => item.label.toLowerCase().includes(query));
  }

  carregarTodasImobiliarias(): void {
    this.imobiliariaFiltradas = [...this.imobiliariaOptions];
  }

  filtrarImobiliariasPrincipais(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();
    const options = this.imobiliariasPrincipalOptions;

    this.imobiliariaPrincipalFiltradas = !query
      ? [...options]
      : options.filter(item => item.label.toLowerCase().includes(query));
  }

  carregarTodasImobiliariasPrincipais(): void {
    this.imobiliariaPrincipalFiltradas = [...this.imobiliariasPrincipalOptions];
  }

  get imobiliariasPrincipalOptions(): { label: string; value: number }[] {
    return this.imobiliariaOptions.filter(option => this.imobiliariaIds.includes(option.value));
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

    if (id) {
      this.modoEdicao = true;
      this.profissionalId = Number(id);
    }
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
        this.imobiliariaFiltradas = [...this.imobiliariaOptions];
        this.carregarTodasImobiliariasPrincipais();
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
    this.nome = profissional.nome || '';
    this.nomeGuerra = profissional.nomeGuerra || '';
    this.cpf = profissional.cpf || '';
    this.telefone = profissional.telefone || '';
    this.email = profissional.email || '';
    this.numeroCreci = profissional.numeroCreci || '';
    this.tipoProfissional = profissional.tipoProfissional || null;
    this.ativo = profissional.ativo;
    this.imobiliariaIds = (profissional.imobiliarias || []).map(item => item.imobiliariaId);
    this.imobiliariaPrincipalId = (profissional.imobiliarias || []).find(item => item.principal)?.imobiliariaId || null;
    this.carregarTodasImobiliariasPrincipais();
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
      tipoProfissional: this.tipoProfissional,
      numeroCreci: this.normalizarTexto(this.numeroCreci),
      ativo: this.ativo,
      imobiliariaPrincipalId,
      imobiliariaIds: imobiliariaIds.length ? imobiliariaIds : undefined,
      imobiliarias: imobiliariaIds.length
        ? imobiliariaIds.map(imobiliariaId => ({
            imobiliariaId,
            tipoProfissional: this.tipoProfissional,
            principal: imobiliariaId === imobiliariaPrincipalId
          }))
        : undefined
    };
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