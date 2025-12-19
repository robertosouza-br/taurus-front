import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CorretorService } from '../../../core/services/corretor.service';
import { CorretorDTO, CorretorSaidaDTO, CorretorCargo, TipoChavePix, Banco, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';

@Component({
  selector: 'app-corretor-edicao',
  templateUrl: './corretor-edicao.component.html',
  styleUrls: ['./corretor-edicao.component.scss']
})
export class CorretorEdicaoComponent implements OnInit {
  corretorId!: string;
  formulario!: FormGroup;
  carregando = false;
  salvando = false;
  submitted = false;
  corretor: CorretorSaidaDTO | null = null;
  bancos: Banco[] = [];
  cargosOptions: { label: string; value: CorretorCargo }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private corretorService: CorretorService,
    private router: Router,
    private messageService: MessageService,
    private permissaoService: PermissaoService
  ) {}

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.CORRETOR, Permissao.ALTERAR)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para alterar corretores'
      });
      this.router.navigate(['/corretores']);
      return;
    }

    this.corretorId = this.route.snapshot.params['id'];
    this.configurarBreadcrumb();
    this.inicializarFormulario();
    this.carregarOpcoes();
    this.carregarBancos();
    this.carregarCorretor();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Corretores', url: '/corretores' },
      { label: 'Editar Corretor' }
    ];
  }

  private inicializarFormulario(): void {
    this.formulario = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]],
      cargo: [CorretorCargo.CORRETOR, Validators.required],
      banco: [null, Validators.required],
      agencia: ['', [Validators.required, Validators.minLength(1)]],
      conta: ['', [Validators.required, Validators.minLength(1)]],
      digitoConta: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2)]],
      tipoChavePix: [TipoChavePix.CPF, Validators.required],
      chavePix: ['', [Validators.required, Validators.minLength(1)]],
      ativo: [true]
    });

    // Desabilitar CPF (não pode ser alterado)
    this.formulario.get('cpf')?.disable();

    // Atualizar validação da chave PIX quando o tipo mudar
    this.formulario.get('tipoChavePix')?.valueChanges.subscribe(() => {
      this.atualizarValidacaoChavePix();
    });
  }

  private carregarBancos(): void {
    this.corretorService.listarBancos().subscribe({
      next: (bancos) => {
        this.bancos = bancos;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar lista de bancos'
        });
      }
    });
  }

  private carregarOpcoes(): void {
    this.cargosOptions = Object.keys(CorretorCargo).map(key => ({
      label: CARGO_LABELS[key as CorretorCargo],
      value: key as CorretorCargo
    }));

    this.tiposChavePixOptions = Object.keys(TipoChavePix).map(key => ({
      label: TIPO_CHAVE_PIX_LABELS[key as TipoChavePix],
      value: key as TipoChavePix
    }));
  }

  private carregarCorretor(): void {
    this.carregando = true;
    this.corretorService.buscarPorId(this.corretorId).subscribe({
      next: (corretor) => {
        this.corretor = corretor;
        this.preencherFormulario(corretor);
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do corretor'
        });
        this.router.navigate(['/corretores']);
      }
    });
  }

  private preencherFormulario(corretor: CorretorSaidaDTO): void {
    this.formulario.patchValue({
      nome: corretor.nome,
      cpf: corretor.cpf,
      email: corretor.email,
      telefone: corretor.telefone,
      cargo: corretor.cargo,
      banco: corretor.banco,
      agencia: corretor.agencia,
      conta: corretor.conta,
      digitoConta: corretor.digitoConta,
      tipoChavePix: corretor.tipoChavePix,
      chavePix: corretor.chavePix,
      ativo: corretor.ativo
    });
  }

  private atualizarValidacaoChavePix(): void {
    const tipoChave = this.formulario.get('tipoChavePix')?.value;
    const chavePix = this.formulario.get('chavePix');

    chavePix?.clearValidators();
    chavePix?.addValidators(Validators.required);

    switch (tipoChave) {
      case TipoChavePix.CPF:
        chavePix?.addValidators([Validators.minLength(11), Validators.maxLength(11)]);
        break;
      case TipoChavePix.CELULAR:
        chavePix?.addValidators([Validators.minLength(10), Validators.maxLength(11)]);
        break;
      case TipoChavePix.EMAIL:
        chavePix?.addValidators(Validators.email);
        break;
      case TipoChavePix.CHAVE_ALEATORIA:
        chavePix?.addValidators([Validators.minLength(32), Validators.maxLength(36)]);
        break;
    }

    chavePix?.updateValueAndValidity();
  }

  onTelefoneInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    this.formulario.get('telefone')?.setValue(value);
  }

  formatarCpfDisplay(cpf: string): string {
    if (!cpf) return '';
    const value = cpf.replace(/\D/g, '');
    return value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  formatarTelefoneDisplay(telefone: string): string {
    if (!telefone) return '';
    const value = telefone.replace(/\D/g, '');
    if (value.length === 11) {
      return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 10) {
      return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.formulario.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios corretamente'
      });
      return;
    }

    this.salvando = true;

    const corretorAtualizado: CorretorDTO = {
      ...this.formulario.getRawValue(),
      telefone: this.formulario.value.telefone.replace(/\D/g, ''),
      chavePix: this.formulario.value.chavePix.replace(/\D/g, '')
    };

    this.corretorService.atualizar(this.corretorId, corretorAtualizado).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Corretor atualizado com sucesso!'
        });
        this.router.navigate(['/corretores']);
      },
      error: (error) => {
        this.salvando = false;
        let mensagem = 'Erro ao atualizar corretor';
        
        if (error.status === 400) {
          mensagem = error.error?.message || 'Dados inválidos';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/corretores']);
  }

  get f() {
    return this.formulario.controls;
  }
}
