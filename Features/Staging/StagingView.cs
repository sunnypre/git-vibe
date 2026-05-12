using GitVibe.Core.Models;
using GitVibe.Styles;
using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Staging;

public class StagingView(List<StagingViewItem> items, int selectedIndex = -1) : Renderable
{
    protected override IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        var table = new Table()
            .Expand()
            .Border(TableBorder.None)
            .HideHeaders();

        table.AddColumn("Pointer", c => c.Width(1).NoWrap());
        table.AddColumn("Status", c => c.Width(10).NoWrap());
        table.AddColumn("File");

        var stagedItems = items.Where(i => i.IsStagedSection).ToList();
        var unstagedItems = items.Where(i => !i.IsStagedSection).ToList();

        int currentIndex = 0;

        if (stagedItems.Count > 0)
        {
            table.AddRow(Text.Empty, new Markup("[bold white]STAGED[/]"), Text.Empty);
            foreach (var item in stagedItems)
            {
                AddFileRow(table, item, currentIndex == selectedIndex);
                currentIndex++;
            }
            table.AddEmptyRow();
        }

        if (unstagedItems.Count > 0)
        {
            table.AddRow(Text.Empty, new Markup("[bold white]UNSTAGED[/]"), Text.Empty);
            foreach (var item in unstagedItems)
            {
                AddFileRow(table, item, currentIndex == selectedIndex);
                currentIndex++;
            }
        }

        if (items.Count == 0)
        {
            table.AddRow(Text.Empty, new Markup("[grey]No changes detected. Repository is clean.[/]"), Text.Empty);
        }

        return ((IRenderable)table).Render(options, maxWidth);
    }

    private static void AddFileRow(Table table, StagingViewItem item, bool isSelected)
    {
        var pointer = isSelected ? (IRenderable)new Markup("[bold blue]>[/]") : Text.Empty;
        var style = isSelected ? "on blue" : "";
        
        var checkbox = item.IsStagedSection ? "[[x]]" : "[[ ]]";
        var statusColor = item.IsStagedSection ? VibeTheme.Staged : VibeTheme.Dimmed;

        var statusMarkup = string.IsNullOrEmpty(style) 
            ? $"[{statusColor}]{checkbox}[/]" 
            : $"[{style}][{statusColor}]{checkbox}[/][/]";

        table.AddRow(
            pointer,
            new Markup(statusMarkup),
            GetFileMarkup(item.File, item.IsStagedSection, style)
        );
    }

    private static Markup GetFileMarkup(GitFile file, bool isStagedSection, string style = "")
    {
        var status = isStagedSection ? file.StagedStatus : file.UnstagedStatus;
        var color = status switch
        {
            GitStatus.Added => VibeTheme.Added,
            GitStatus.Modified => VibeTheme.Modified,
            GitStatus.Deleted => VibeTheme.Deleted,
            GitStatus.Untracked => VibeTheme.Untracked,
            _ => VibeTheme.Dimmed
        };

        var icon = status switch
        {
            GitStatus.Added => VibeTheme.AddedIcon,
            GitStatus.Modified => VibeTheme.ModifiedIcon,
            GitStatus.Deleted => VibeTheme.DeletedIcon,
            GitStatus.Untracked => VibeTheme.UntrackedIcon,
            _ => " "
        };

        var path = file.OriginalPath != null 
            ? $"{Markup.Escape(file.OriginalPath)} -> {Markup.Escape(file.Path)}" 
            : Markup.Escape(file.Path);
            
        var fullStyle = string.IsNullOrEmpty(style) ? color : $"{color} {style}";
        return new Markup($"[{fullStyle}]{icon} {path}[/]");
    }
}
